import type { Metadata } from 'next'
import { Nunito, Caveat, Gochi_Hand, Newsreader, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

const gochiHand = Gochi_Hand({
  variable: '--font-gochi',
  subsets: ['latin'],
  weight: ['400'],
})

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
})

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
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
      className={`${nunito.variable} ${caveat.variable} ${gochiHand.variable} ${newsreader.variable} ${cormorant.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
