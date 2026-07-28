"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User } from "@/types/auth";
import { Gift, ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
  user: User;
}

export function WelcomeScreen({ user }: WelcomeScreenProps) {
  // Dynamically extract user's first name
  const firstName = useMemo(() => {
    const rawName = user.name || user.full_name || user.email.split("@")[0];
    const cleaned = rawName.trim().split(/\s+/)[0];
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }, [user]);

  // Determine greeting & emoji based on current local time
  const { greeting, emoji } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { greeting: "Good Morning", emoji: "☀️" };
    } else if (hour >= 12 && hour < 17) {
      return { greeting: "Good Afternoon", emoji: "🌤️" };
    } else {
      return { greeting: "Good Evening", emoji: "🌙" };
    }
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-9rem)] w-full overflow-hidden px-4 select-none">
      {/* Ambient background glow for visual depth */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[450px] sm:w-[600px] h-[450px] sm:h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl opacity-70 animate-pulse" />
      </div>

      {/* Main Container with 800ms easeOut Entrance Animation */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center max-w-5xl mx-auto text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Subtle continuous floating animation (4-6px movement) */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{
            repeat: Infinity,
            duration: 6,
            ease: "easeInOut",
          }}
          className="flex flex-col items-center space-y-4"
        >
          {/* Main Large Greeting (64-80px desktop responsive) */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-extrabold tracking-tight text-foreground leading-[1.1] text-balance">
            {greeting},{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              {firstName}
            </span>{" "}
            <span className="inline-block transition-transform hover:scale-110 duration-300">
              {emoji}
            </span>
          </h1>

          {/* Minimal Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium tracking-wide pt-2"
          >
            Welcome back.
          </motion.p>
        </motion.div>

        {/* Minimal Navigation Button to Wishlist */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="pt-12 sm:pt-16"
        >
          <Link href="/wishlist">
            <Button
              variant="ghost"
              size="lg"
              className="gap-2.5 text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-full px-6 transition-all duration-300 group text-sm font-medium border border-border/40"
            >
              <Gift className="w-4 h-4 text-primary transition-transform group-hover:scale-110" />
              <span>Go to Wishlist</span>
              <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
