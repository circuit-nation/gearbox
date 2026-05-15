import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EventModel } from "@/lib/models/core.models";
import { buildListResponse, toDocument, toDocuments, type DocWithId } from "@/lib/mongo-helpers";
import { storedValueToS3Key } from "@/lib/image-storage";
import { deleteS3ObjectByKey } from "@/lib/s3-server";
import { eventSchema } from "@/lib/circuit-nation/validators";
import {
  deleteEventLinks,
  serializeEventLinks,
  syncEventLinks,
} from "@/lib/circuit-nation/event-links";
import { buildSort, isValidObjectId, parsePagination } from "@/lib/circuit-nation/route-helpers";
import type { Event } from "@/lib/circuit-nation/types";

function serializeEvent<T extends Record<string, unknown>>(doc: T) {
  const serialized = toDocument<Event>(doc as DocWithId);
  if (!serialized) {
    return null;
  }

  const withLinks = serializeEventLinks(doc) as T & {
    links?: Event["links"];
    links_id?: string | null;
  };
  if ("links" in withLinks && withLinks.links) {
    serialized.links = withLinks.links;
    serialized.links_id = withLinks.links_id;
  }

  return serialized;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const filterTitle = searchParams.get("filterTitle");
    const filterType = searchParams.get("filterType");
    const filterSport = searchParams.get("filterSport");

    if (id) {
      if (!isValidObjectId(id)) {
        return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
      }

      const document = await EventModel.findById(id).populate("links_id").lean();
      if (!document) {
        return NextResponse.json({ error: "Event not found." }, { status: 404 });
      }

      return NextResponse.json({
        data: serializeEvent(document as Record<string, unknown>),
      });
    }

    const query: Record<string, unknown> = {};
    if (filterTitle) {
      query.title = { $regex: filterTitle, $options: "i" };
    }
    if (filterType) {
      query.type = filterType;
    }
    if (filterSport && isValidObjectId(filterSport)) {
      query.sport_id = filterSport;
    }

    const [total, documents] = await Promise.all([
      EventModel.countDocuments(query),
      EventModel.find(query)
        .sort(buildSort(sortBy, sortOrder))
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      data: buildListResponse(
        total,
        toDocuments<Event>(documents as DocWithId[]).map((document) => ({
          ...document,
          event_start_at: new Date(document.event_start_at).toISOString(),
          event_end_at: new Date(document.event_end_at).toISOString(),
        }))
      ),
    });
  } catch (error) {
    console.error("[events:GET]", error);
    return NextResponse.json({ error: "Failed to fetch events." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const payload = await request.json();
    const parsed = eventSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
    }

    const { links, links_id: incomingLinksId, ...eventData } = parsed.data;
    const linksId = await syncEventLinks(incomingLinksId, links);

    const document = await EventModel.create({
      ...eventData,
      links_id: linksId,
    });

    const populated = await EventModel.findById(document._id).populate("links_id").lean();
    return NextResponse.json(
      {
        data: serializeEvent((populated ?? document.toObject()) as Record<string, unknown>),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[events:POST]", error);
    return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = (await request.json()) as Partial<Event> & {
      id?: string;
      links?: Event["links"];
    };
    const { id, ...data } = body;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
    }

    const parsed = eventSchema.partial().safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
    }

    const existing = await EventModel.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const { links: parsedLinks, links_id: parsedLinksId, ...eventData } = parsed.data;
    const updateData: Record<string, unknown> = { ...eventData };

    if (parsedLinks !== undefined || parsedLinksId !== undefined) {
      updateData.links_id = await syncEventLinks(
        parsedLinksId ?? (existing.links_id ? String(existing.links_id) : null),
        parsedLinks ?? undefined
      );
    }

    const document = await EventModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("links_id")
      .lean();

    if (!document) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    return NextResponse.json({
      data: serializeEvent(document as Record<string, unknown>),
    });
  } catch (error) {
    console.error("[events:PUT]", error);
    return NextResponse.json({ error: "Failed to update event." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const id = request.nextUrl.searchParams.get("id");

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
    }

    const existingEvent = await EventModel.findById(id).lean();
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const imageKeys = Array.from(
      new Set(
        ((existingEvent.images || []) as string[])
          .map((image) => storedValueToS3Key(image))
          .filter((key): key is string => Boolean(key))
      )
    );

    await Promise.all(imageKeys.map((key) => deleteS3ObjectByKey(key)));
    await EventModel.findByIdAndDelete(id);
    await deleteEventLinks(existingEvent.links_id ? String(existingEvent.links_id) : null);

    return NextResponse.json({ data: { success: true, id } });
  } catch (error) {
    console.error("[events:DELETE]", error);
    return NextResponse.json({ error: "Failed to delete event." }, { status: 500 });
  }
}
