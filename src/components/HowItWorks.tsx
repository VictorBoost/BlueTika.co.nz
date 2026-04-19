import { FileText, MessageSquare, CheckCircle2 } from "lucide-react";

const clientSteps = [
  {
    icon: FileText,
    title: "Post Your Project",
    description: "Describe what you need done, set your budget, and specify your location.",
  },
  {
    icon: MessageSquare,
    title: "Review Bids",
    description: "Receive bids from qualified service providers. Compare prices and profiles.",
  },
  {
    icon: CheckCircle2,
    title: "Hire & Complete",
    description: "Accept the best bid, create a contract, and get your project completed.",
  },
];

const providerSteps = [
  {
    icon: FileText,
    title: "Find Projects",
    description: "Browse available projects that match your skills and location.",
  },
  {
    icon: MessageSquare,
    title: "Submit Bids",
    description: "Offer your services with competitive pricing and showcase your expertise.",
  },
  {
    icon: CheckCircle2,
    title: "Get Hired",
    description: "Win contracts, complete quality work, and build your reputation.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-20 md:py-32">
      <div className="container">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-5xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Simple steps to connect Kiwis with local service providers.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* For Clients */}
          <div>
            <h3 className="mb-8 text-2xl font-bold text-accent">
              For Clients
            </h3>
            <div className="space-y-8">
              {clientSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="mb-2 text-xl font-semibold text-gray-900">{step.title}</h4>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For Service Providers */}
          <div>
            <h3 className="mb-8 text-2xl font-bold text-success">
              For Service Providers
            </h3>
            <div className="space-y-8">
              {providerSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success text-white">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="mb-2 text-xl font-semibold text-gray-900">{step.title}</h4>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}