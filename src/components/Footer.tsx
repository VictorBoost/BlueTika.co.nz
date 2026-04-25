import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-black text-white py-12">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">BlueTika</h3>
            <p className="text-sm text-gray-400">
              New Zealand's trusted marketplace for local services
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Clients</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/post-project" className="text-gray-400 hover:text-white transition-colors">
                  Post a Project
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-gray-400 hover:text-white transition-colors">
                  Browse Projects
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Service Providers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/projects" className="text-gray-400 hover:text-white transition-colors">
                  Find Work
                </Link>
              </li>
              <li>
                <Link href="/provider/verify" className="text-gray-400 hover:text-white transition-colors">
                  Get Verified
                </Link>
              </li>
              <li>
                <Link href="/contracts" className="text-gray-400 hover:text-white transition-colors">
                  My Contracts
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-accent transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/testimonials" className="text-muted-foreground hover:text-accent transition-colors">
                  Testimonials
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-accent transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-accent transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm font-semibold">
              100% NZ Owned · Kiwis Helping Kiwis · <Link href="/terms" className="underline hover:text-teal-400 transition-colors">Terms</Link> · <Link href="/privacy" className="underline hover:text-teal-400 transition-colors">Privacy</Link> · bluetika.co.nz
            </p>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} BlueTika. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}