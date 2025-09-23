"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TypewriterTextProps {
  words: string[];
  className?: string;
  speed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
}

export default function TypewriterText({
  words,
  className = "",
  speed = 120,
  deleteSpeed = 50,
  pauseDuration = 1500
}: TypewriterTextProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    const shouldDelete = isDeleting;

    const timeout = setTimeout(() => {
      if (!shouldDelete) {
        // Typing
        if (currentText !== currentWord) {
          setCurrentText(currentWord.slice(0, currentText.length + 1));
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      } else {
        // Deleting
        if (currentText !== "") {
          setCurrentText(currentWord.slice(0, currentText.length - 1));
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, shouldDelete ? deleteSpeed : speed);

    return () => clearTimeout(timeout);
  }, [currentText, currentWordIndex, isDeleting, words, speed, deleteSpeed, pauseDuration]);

  return (
    <span className={`inline-block ${className}`}>
      <span>{currentText}</span>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="inline-block w-[3px] h-[1.2em] bg-cyan-500 ml-[2px] align-middle"
      />
    </span>
  );
}