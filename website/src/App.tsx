import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

function App() {
	return (
		<main className="min-h-screen">
			<Hero />
			<Features />
			<HowItWorks />
			<FAQ />
			<Footer />
		</main>
	);
}

export default App;
