import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"Lumen — Different worlds, same signal", description:"A cinematic brand experience generator powered by AMD ROCm." };
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html> }
