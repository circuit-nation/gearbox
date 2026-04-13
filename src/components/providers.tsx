"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

type ProvidersProps = {
	children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
	return (
		<QueryProvider>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<TooltipProvider>
					{children}
				</TooltipProvider>
			</ThemeProvider>
			<Toaster />
		</QueryProvider>
	);
}
