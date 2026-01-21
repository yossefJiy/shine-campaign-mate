import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  CheckSquare, 
  ArrowLeft, 
  Sparkles, 
  Trophy,
  Flame,
  Target,
  Users,
  Zap,
  CheckCircle2,
} from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const authHref = user ? "/dashboard" : "/auth";
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Subtle Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 mb-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <CheckSquare className="w-8 h-8 text-primary-foreground" />
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.1 }} 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight"
          >
            <span className="text-foreground">ניהול משימות.</span>
            <br />
            <span className="text-primary">
              בצורה חכמה.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2 }} 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            מערכת מינימליסטית וחזקה לניהול משימות ופרויקטים.
            <br />
            <span className="text-foreground font-medium">
              עם גיימיפיקציה, AI, ותובנות בזמן אמת.
            </span>
          </motion.p>

          {/* CTA Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.3 }} 
          >
            <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg shadow-primary/20">
              <Link to={authHref}>
                {user ? "לדשבורד" : "התחילו עכשיו"}
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          {/* Features Row */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.6, delay: 0.5 }} 
            className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>ללא התחייבות</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>חינמי להתחלה</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>תמיכה בעברית</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              הכל מה שצריך
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              כלים חכמים שהופכים את ניהול המשימות לחוויה
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Target,
                title: "מעקב מדויק",
                description: "עקוב אחרי כל משימה ופרויקט עם סטטוסים ותאריכי יעד",
              },
              {
                icon: Trophy,
                title: "גיימיפיקציה",
                description: "צבור נקודות, שמור על streaks והשג הישגים",
              },
              {
                icon: Sparkles,
                title: "AI חכם",
                description: "קבל הצעות לעדיפות, זמן משוער וסיכומים אוטומטיים",
              },
              {
                icon: Users,
                title: "עבודת צוות",
                description: "שתף משימות, הקצה עובדים וראה את הלידרבורד",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-background rounded-2xl p-6 border border-border hover:border-primary/30 transition-all hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification Preview */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                הפוך כל משימה להישג
              </h2>
              <p className="text-lg text-muted-foreground">
                מערכת גיימיפיקציה שמניעה אותך קדימה
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20 text-center"
              >
                <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-1">נקודות</h3>
                <p className="text-sm text-muted-foreground">
                  צבור נקודות על כל משימה שאתה משלים
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-2xl p-6 border border-orange-500/20 text-center"
              >
                <Flame className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-1">Streaks</h3>
                <p className="text-sm text-muted-foreground">
                  שמור על רצף ימים פעילים לבונוסים
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-6 border border-accent/20 text-center"
              >
                <Zap className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-1">הישגים</h3>
                <p className="text-sm text-muted-foreground">
                  פתח הישגים והוכח את הביצועים שלך
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              מוכנים להתחיל?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              הצטרפו עכשיו והתחילו לנהל את המשימות שלכם בצורה חכמה יותר
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link to={authHref}>
                {user ? "לדשבורד" : "התחילו בחינם"}
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Tasks. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
