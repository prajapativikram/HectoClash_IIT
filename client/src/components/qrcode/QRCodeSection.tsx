import { useState, useEffect } from 'react';
import { CopyCheck, Copy, Smartphone, Laptop, Tablet, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

interface DeviceContentProps {
  title: string;
  description: string;
  appUrl: string;
  copied: boolean;
  onCopy: () => void;
}

const DeviceContent = ({ title, description, appUrl, copied, onCopy }: DeviceContentProps) => (
  <div className="p-6 rounded-lg bg-white shadow-lg text-center">
    <h3 className="text-xl font-bold mb-4">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
    
    <div className="bg-gray-100 p-4 mb-6 rounded-lg">
      <div className="w-48 h-48 mx-auto bg-white border rounded-md flex items-center justify-center mb-4 p-2">
        <QRCodeSVG
          value={appUrl}
          size={176}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"H"}
          includeMargin={false}
        />
      </div>
      <div className="flex items-center justify-between bg-gray-200 px-3 py-2 rounded">
        <code className="text-sm text-primary font-mono truncate">{appUrl}</code>
        <div className="flex">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onCopy}
            className="ml-2 flex-shrink-0"
          >
            {copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 flex-shrink-0 p-2 rounded hover:bg-gray-100"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
    
    <div className="text-sm text-gray-500">
      Scan the QR code or enter the URL directly in your device
    </div>
  </div>
);

const QRCodeSection = () => {
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [copiedTablet, setCopiedTablet] = useState(false);
  const [copiedDesktop, setCopiedDesktop] = useState(false);
  const [usePublishedUrl, setUsePublishedUrl] = useState(true); // Default to published URL for better compatibility
  const { toast } = useToast();

  // Reset copy states after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCopiedMobile(false);
      setCopiedTablet(false);
      setCopiedDesktop(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [copiedMobile, copiedTablet, copiedDesktop]);

  const handleCopy = (text: string, device: 'mobile' | 'tablet' | 'desktop') => {
    navigator.clipboard.writeText(text).then(() => {
      if (device === 'mobile') setCopiedMobile(true);
      if (device === 'tablet') setCopiedTablet(true);
      if (device === 'desktop') setCopiedDesktop(true);

      toast({
        title: "Copied to clipboard",
        description: `The URL has been copied. Paste it in your ${device} browser.`,
      });
    });
  };

  // Get the hostname and port for the app URL
  const hostname = window.location.hostname;
  const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  const protocol = window.location.protocol;
  
  // Base app URL for desktop
  const appUrl = window.location.origin;
  
  // For mobile/tablet use Expo deep links that work with Expo Go
  // Format: exp://<ip-address>:<port>
  // Note: 192.168.X.X would be your local IP when testing on LAN
  // On Replit, we use the hostname (which will be a replit.dev domain)
  // For Expo Go to properly connect on local networks, we'll default to the hostname
  // When the app is hosted on Replit, the hostname will be a replit.dev domain
  // For local development, we will just use the hostname since that works better with Expo Go
  const expoDomain = hostname;
  
  // We're moving to direct web URLs for better compatibility instead of Expo
  // This way, the user can open the app directly in their mobile browser
  const mobileAppUrl = window.location.origin;
  const tabletAppUrl = mobileAppUrl;
  const desktopAppUrl = appUrl;
  
  // For users who still want to use Expo Go app
  // Using the standard format that works in most environments - prefixed with "exp+"
  const expoPublishedUrl = `exp+${protocol}//${expoDomain}`;
  
  // Use the published URL for mobile/tablet to ensure better compatibility
  const publishedMobileUrl = mobileAppUrl; // Direct web access
  const publishedTabletUrl = mobileAppUrl; // Direct web access

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="mobile">
            <div className="flex flex-col items-center mb-8">
              <TabsList className="mb-4">
                <TabsTrigger value="mobile" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Mobile</span>
                </TabsTrigger>
                <TabsTrigger value="tablet" className="flex items-center gap-2">
                  <Tablet className="h-4 w-4" />
                  <span>Tablet</span>
                </TabsTrigger>
                <TabsTrigger value="desktop" className="flex items-center gap-2">
                  <Laptop className="h-4 w-4" />
                  <span>Desktop</span>
                </TabsTrigger>
              </TabsList>
              
              {/* URL Type Toggle (Direct or Published) */}
              <div className="flex items-center gap-2 mb-6 mt-2 border p-2 rounded-lg bg-gray-50">
                <span className={`text-xs ${!usePublishedUrl ? 'font-medium' : ''}`}>Direct URL</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={usePublishedUrl} 
                    onChange={() => setUsePublishedUrl(!usePublishedUrl)} 
                    className="sr-only peer"
                  />
                  <div className={`
                    w-9 h-5 bg-gray-200 rounded-full peer 
                    peer-checked:after:translate-x-full peer-checked:after:border-white 
                    after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                    after:bg-white after:border-gray-300 after:border after:rounded-full 
                    after:h-4 after:w-4 after:transition-all
                    peer-checked:bg-primary
                  `}></div>
                </label>
                <span className={`text-xs ${usePublishedUrl ? 'font-medium' : ''}`}>Published URL</span>
              </div>
            </div>
            
            <TabsContent value="mobile">
              <DeviceContent 
                title="Connect Your Phone"
                description="Get MentalBooster on your smartphone for brain training on the go."
                appUrl={usePublishedUrl ? publishedMobileUrl : mobileAppUrl}
                copied={copiedMobile}
                onCopy={() => handleCopy(usePublishedUrl ? publishedMobileUrl : mobileAppUrl, 'mobile')}
              />
            </TabsContent>
            
            <TabsContent value="tablet">
              <DeviceContent 
                title="Connect Your Tablet"
                description="Take advantage of the larger screen for an immersive brain training experience."
                appUrl={usePublishedUrl ? publishedTabletUrl : tabletAppUrl}
                copied={copiedTablet}
                onCopy={() => handleCopy(usePublishedUrl ? publishedTabletUrl : tabletAppUrl, 'tablet')}
              />
            </TabsContent>
            
            <TabsContent value="desktop">
              <DeviceContent 
                title="Connect Your Desktop"
                description="Use your desktop for the full featured experience and advanced analytics."
                appUrl={desktopAppUrl}
                copied={copiedDesktop}
                onCopy={() => handleCopy(desktopAppUrl, 'desktop')}
              />
            </TabsContent>
          </Tabs>
          
          <div className="mt-12 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">How to Connect</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Select your device type from the tabs above</li>
              <li>Scan the QR code with your device's camera app</li>
              <li>Your device will open the web app directly in your browser</li>
              <li>Alternatively, copy the URL and open it manually in your browser</li>
              <li>Log in with the same account on all your devices to sync progress</li>
            </ol>
            
            <div className="mt-6 bg-blue-50 p-4 rounded-lg text-blue-700 text-sm">
              <strong>Note:</strong> MentalBooster now works directly in your browser! No need for separate 
              apps or installations. Simply scan the QR code or enter the URL in your mobile browser.
            </div>
            
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold mb-2">Additional Connection Options</h4>
              <div className="mb-4">
                <h5 className="font-medium text-sm mb-1">Option 1: Direct Web Access (Recommended)</h5>
                <p className="text-sm text-gray-600">Simply scan the QR code with your device's camera app or enter the URL in any browser.</p>
              </div>
              
              <div className="mb-4">
                <h5 className="font-medium text-sm mb-1">Option 2: Using Expo Go</h5>
                <p className="text-sm text-gray-600 mb-2">For development purposes, you can still use Expo Go:</p>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>Install the <strong>Expo Go</strong> app from your device's app store</li>
                  <li>Open Expo Go and tap on "Enter URL manually"</li> 
                  <li>Enter the URL with the "exp+" prefix (toggle "Published URL" above)</li>
                </ol>
              </div>
              
              <h4 className="font-semibold mb-2 mt-4">Troubleshooting</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>If scanning doesn't work, try entering the URL manually in your browser</li>
                <li>Make sure your device has an internet connection</li>
                <li>Try clearing your browser cache if you experience any issues</li>
                <li>For best performance, use Chrome, Safari, or Firefox browsers</li>
                <li>If you encounter any problems, please contact support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QRCodeSection;