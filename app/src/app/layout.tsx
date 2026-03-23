import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Sounds Fishy',
    description: 'A storytelling and bluffing game for 4-8 players',
    icons: {
        icon: '/favicon.svg',
        apple: '/favicon.svg',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="font-sans antialiased">{children}</body>
        </html>
    );
}
