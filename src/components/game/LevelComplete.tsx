"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useI18n } from "@/hooks/useI18n";

interface LevelCompleteProps {
  level: number;
  onNext: () => void;
}

export function LevelComplete({ level, onNext }: LevelCompleteProps) {
  const { language, t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-bg-base/82 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-complete-title"
      data-testid="level-complete"
    >
      <Card className="my-auto w-full max-w-sm p-6 text-center">
        <Trophy className="mx-auto size-9 text-warning" aria-hidden="true" />
        <h2 id="level-complete-title" className="mt-3 text-xl font-bold text-fg">
          {t("levelComplete")}
        </h2>
        <p className="mt-1 text-sm text-fg-secondary">
          {t("level")} {level}
        </p>
        <div className="mt-4">
          <ProgressBar value={100} aria-label={t("levelComplete")} />
        </div>
        <Button
          type="button"
          className="mt-5 w-full"
          data-testid="next-level"
          onClick={onNext}
          icon={language === "fa-AF" ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
          iconPosition="end"
        >
          {t("nextLevel")}
        </Button>
      </Card>
    </motion.div>
  );
}
