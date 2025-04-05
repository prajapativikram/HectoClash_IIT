import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-[#14213d] text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold font-sans mb-4">Mental<span className="text-red-500">Booster</span></h3>
            <p className="text-gray-400 text-sm mb-4">
              Comprehensive brain training platform with multiple cognitive games to enhance your mental abilities.
            </p>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} MentalBooster. All rights reserved.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Play</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/play/hectoclash" className="text-gray-400 hover:text-white transition">
                  Quick Match
                </Link>
              </li>
              <li>
                <Link href="/games" className="text-gray-400 hover:text-white transition">
                  Tournaments
                </Link>
              </li>
              <li>
                <Link href="/play/hectoclash" className="text-gray-400 hover:text-white transition">
                  Practice Mode
                </Link>
              </li>
              <li>
                <Link href="/connect" className="text-gray-400 hover:text-white transition">
                  Connect Devices
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Learn</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/learn/hectoclash" className="text-gray-400 hover:text-white transition">
                  How to Play
                </Link>
              </li>
              <li>
                <Link href="/learn/hectoclash" className="text-gray-400 hover:text-white transition">
                  Strategy Guide
                </Link>
              </li>
              <li>
                <Link href="/learn/hectoclash" className="text-gray-400 hover:text-white transition">
                  Video Tutorials
                </Link>
              </li>
              <li>
                <Link href="/learn/hectoclash" className="text-gray-400 hover:text-white transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">About</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} MentalBooster. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
