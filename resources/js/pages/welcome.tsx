import { Head, Link } from '@inertiajs/react';
import { ChefHat, ArrowRight, LogIn } from 'lucide-react';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome | Chef2Comply" />
            
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="z-10 w-full max-w-4xl px-6 flex flex-col items-center text-center">
                    <div className="mb-8 p-5 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 shadow-xl inline-flex items-center justify-center">
                        <ChefHat className="w-14 h-14 text-emerald-600" strokeWidth={1.5} />
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-6 tracking-tight pb-2">
                        Chef2Comply
                    </h1>
                    
                    <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-6">
                        Digital Food Safety Management System
                    </h2>
                    
                    <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl leading-relaxed">
                        Streamline your HACCP compliance, digitize your checklists, and ensure complete food safety across all your restaurant locations from a single, intuitive dashboard.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <Link
                            href={route('login')}
                            className="group flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(5,150,105,0.3)] hover:shadow-[0_0_30px_rgba(5,150,105,0.5)] transform hover:-translate-y-1"
                        >
                            <LogIn className="w-5 h-5" />
                            Client & Restaurant Login
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
                
                <div className="absolute bottom-8 text-slate-500 text-sm font-medium">
                    &copy; {new Date().getFullYear()} Chef2Comply. All rights reserved.
                </div>
            </div>
        </>
    );
}
