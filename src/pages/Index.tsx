import StarField from "@/components/StarField";
import CursorGlow from "@/components/CursorGlow";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PricePool from "@/components/PricePool";
import LiveCounters from "@/components/LiveCounters";
import EventTimeline from "@/components/EventTimeline";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="relative min-h-screen">
      <StarField />
      <CursorGlow />
      <Navbar />
      <Hero />
      <PricePool />
      <LiveCounters />
      <EventTimeline />
      <Footer />
    </div>
  );
};

export default Index;
