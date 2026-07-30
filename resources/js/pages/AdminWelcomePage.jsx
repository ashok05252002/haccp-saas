import { Head, Link } from '@inertiajs/react';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export default function AdminWelcomePage() {
    return (
        <>
            <Head title="Admin Portal | Chef2Comply" />
            
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="z-10 w-full max-w-3xl px-6 flex flex-col items-center text-center">
                    <div className="mb-8 p-4 bg-slate-900/50 backdrop-blur-sm rounded-full border border-slate-800 shadow-xl inline-flex items-center justify-center">
                        <ShieldCheck className="w-12 h-12 text-blue-500" strokeWidth={1.5} />
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-6 tracking-tight">
                        Chef2Comply Admin
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
                        The central command center for managing tenants, restaurants, and overseeing the entire digital food safety ecosystem. Secure access required.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <Link
                            href={route('super-admin.login')}
                            className="group flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transform hover:-translate-y-1"
                        >
                            <Lock className="w-5 h-5" />
                            Secure Admin Login
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
                
                <div className="absolute bottom-8 text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} Chef2Comply. All rights reserved.
                </div>
            </div>
        </>
    );
}
