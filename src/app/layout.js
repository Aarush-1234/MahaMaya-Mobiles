import { Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { ShopProvider } from "../context/ShopContext";
import CartDrawer from "../components/CartDrawer";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "COVERS ZONE | Premium Mobile Covers & Accessories",
  description: "Browse premium mobile covers, tempered glass, chargers, earbuds, and accessories at COVERS ZONE. Easy catalog viewing and quick WhatsApp ordering with local delivery.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable}>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body>
        <ShopProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </ShopProvider>
      </body>
    </html>
  );
}
