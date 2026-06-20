import type { Metadata } from 'next'
import { Newsreader, Caveat } from 'next/font/google'
import './globals.css'

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
})

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Aspire — My Bucket List',
  description: "The things I'm living for",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${caveat.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
