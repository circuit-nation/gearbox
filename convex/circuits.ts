import { v } from "convex/values";
import { query } from "./_generated/server";

function toClient(doc: any) {
  return {
    ...doc,
    convexId: doc._id,
  };
}

export const getMany = query({
  args: { ids: v.array(v.id("circuits")) },
  handler: async (ctx, args) => {
    const docs = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return docs.filter(Boolean).map(toClient);
  },
});
