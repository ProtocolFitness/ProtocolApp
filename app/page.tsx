import Feed from "@/components/Feed";
import Header from "@/components/Header";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <div className="max-w-lg mx-auto px-4 pb-28">
        <Feed />
      </div>
    </main>
  );
}
