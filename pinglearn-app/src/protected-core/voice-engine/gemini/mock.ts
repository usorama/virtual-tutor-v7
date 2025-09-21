/**
 * Gemini Mock Service
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Mock responses and scenarios for testing Gemini integration
 * Used for development and testing until Phase 2 implementation
 */

import { GeminiResponse, GeminiCandidate, MathExpression, EducationalContext } from './types';

// Response structure for mock scenarios
export interface MockResponse {
  text: string;
  mathExpressions: MathExpression[];
  confidence: number;
}

// Mock responses for different educational scenarios
export const MOCK_RESPONSES = {
  mathematics: {
    introduction: {
      text: "Hello! I'm your AI math teacher. I'm here to help you understand mathematical concepts in a way that makes sense to you.",
      mathExpressions: [],
      confidence: 0.95
    },
    quadraticFormula: {
      text: "The quadratic formula is a powerful tool for solving quadratic equations. When we have an equation in the form $ax^2 + bx + c = 0$, we can find the solutions using $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.",
      mathExpressions: [
        {
          latex: "ax^2 + bx + c = 0",
          description: "Standard form of a quadratic equation",
          context: "equation" as const,
          complexity: "basic" as const
        },
        {
          latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
          description: "Quadratic formula for solving quadratic equations",
          context: "formula" as const,
          complexity: "intermediate" as const
        }
      ],
      confidence: 0.98
    },
    algebraBasics: {
      text: "Let's start with basic algebra. When we solve for $x$ in the equation $2x + 5 = 13$, we need to isolate $x$ by performing the same operations on both sides.",
      mathExpressions: [
        {
          latex: "2x + 5 = 13",
          description: "Simple linear equation",
          context: "equation" as const,
          complexity: "basic" as const
        }
      ],
      confidence: 0.97
    },
    calculus: {
      text: "Calculus helps us understand rates of change. The derivative of $f(x) = x^2$ is $f'(x) = 2x$, which tells us the slope of the function at any point.",
      mathExpressions: [
        {
          latex: "f(x) = x^2",
          description: "Quadratic function",
          context: "equation" as const,
          complexity: "intermediate" as const
        },
        {
          latex: "f'(x) = 2x",
          description: "Derivative of quadratic function",
          context: "formula" as const,
          complexity: "intermediate" as const
        }
      ],
      confidence: 0.96
    }
  },
  science: {
    introduction: {
      text: "Welcome to our science exploration! I'm here to help you discover the fascinating world of scientific concepts and how they apply to our everyday lives.",
      mathExpressions: [],
      confidence: 0.94
    },
    physics: {
      text: "Newton's second law states that force equals mass times acceleration, or $F = ma$. This fundamental principle helps us understand motion and forces.",
      mathExpressions: [
        {
          latex: "F = ma",
          description: "Newton's second law of motion",
          context: "formula" as const,
          complexity: "basic" as const
        }
      ],
      confidence: 0.97
    }
  },
  general: {
    greeting: {
      text: "Hello! I'm your AI learning assistant. I'm here to help you learn and understand any topic you're interested in. What would you like to explore today?",
      mathExpressions: [],
      confidence: 0.93
    },
    encouragement: {
      text: "Great question! Learning is all about curiosity and asking the right questions. Let's explore this together.",
      mathExpressions: [],
      confidence: 0.95
    }
  }
};

// Mock scenarios for different learning contexts
export class GeminiMockScenarios {
  static getResponseForContext(context: EducationalContext, topic?: string): MockResponse {
    const subject = context.subject;

    if (subject === 'mathematics') {
      if (topic?.toLowerCase().includes('quadratic')) {
        return MOCK_RESPONSES.mathematics.quadraticFormula;
      } else if (topic?.toLowerCase().includes('algebra')) {
        return MOCK_RESPONSES.mathematics.algebraBasics;
      } else if (topic?.toLowerCase().includes('calculus')) {
        return MOCK_RESPONSES.mathematics.calculus;
      } else {
        return MOCK_RESPONSES.mathematics.introduction;
      }
    } else if (subject === 'science') {
      if (topic?.toLowerCase().includes('physics') || topic?.toLowerCase().includes('force')) {
        return MOCK_RESPONSES.science.physics;
      } else {
        return MOCK_RESPONSES.science.introduction;
      }
    } else {
      return MOCK_RESPONSES.general.greeting;
    }
  }

  static generateProgressiveMathLesson(): MockResponse[] {
    return [
      MOCK_RESPONSES.mathematics.introduction,
      MOCK_RESPONSES.mathematics.algebraBasics,
      MOCK_RESPONSES.mathematics.quadraticFormula,
      MOCK_RESPONSES.mathematics.calculus
    ];
  }

  static generateEncouragementResponse(): MockResponse {
    return MOCK_RESPONSES.general.encouragement;
  }
}

// Mock Gemini API responses
export class GeminiMockAPI {
  static createMockResponse(text: string, _mathExpressions: MathExpression[] = [], _confidence = 0.95): GeminiResponse {
    const candidate: GeminiCandidate = {
      content: {
        parts: [
          { text }
        ],
        role: 'model'
      },
      finishReason: 'STOP',
      index: 0,
      safetyRatings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          probability: 'NEGLIGIBLE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          probability: 'NEGLIGIBLE'
        }
      ]
    };

    return {
      candidates: [candidate],
      usageMetadata: {
        promptTokenCount: Math.floor(Math.random() * 50) + 10,
        candidatesTokenCount: Math.floor(text.length / 4),
        totalTokenCount: Math.floor(text.length / 4) + Math.floor(Math.random() * 50) + 10
      },
      modelVersion: 'gemini-2.0-flash-live'
    };
  }

  static createStreamChunk(text: string, isFinal = false): string {
    const chunk = {
      candidates: [{
        content: {
          parts: [{ text }],
          role: 'model'
        },
        finishReason: isFinal ? 'STOP' : undefined
      }]
    };

    return JSON.stringify(chunk);
  }

  static simulateTypingDelay(text: string): number {
    // Simulate realistic typing/generation speed
    const baseDelay = 50; // ms per character
    const variance = Math.random() * 30; // ±30ms variance
    return (text.length * baseDelay) + variance;
  }
}

// Mock learning session scenarios
export const MOCK_LEARNING_SESSIONS = {
  algebraBeginnerSession: [
    "Hello! Let's start with basic algebra today.",
    "When we have an equation like $x + 5 = 10$, we want to find the value of $x$.",
    "To solve this, we subtract 5 from both sides: $x + 5 - 5 = 10 - 5$",
    "This simplifies to $x = 5$. Let's try another example.",
    "How about $2x = 14$? What operation should we use to solve for $x$?"
  ],

  quadraticIntermediateSession: [
    "Today we'll explore quadratic equations. These are equations where the highest power of the variable is 2.",
    "A quadratic equation has the general form $ax^2 + bx + c = 0$, where $a \\neq 0$.",
    "The quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ can solve any quadratic equation.",
    "Let's practice with $x^2 - 5x + 6 = 0$. Here, $a = 1$, $b = -5$, and $c = 6$.",
    "Substituting into the formula: $x = \\frac{5 \\pm \\sqrt{25 - 24}}{2} = \\frac{5 \\pm 1}{2}$",
    "So our solutions are $x = 3$ and $x = 2$. Can you verify these by substitution?"
  ],

  calculusAdvancedSession: [
    "Welcome to calculus! Today we'll explore the concept of derivatives.",
    "A derivative measures how a function changes as its input changes.",
    "For the function $f(x) = x^2$, the derivative is $f'(x) = 2x$.",
    "This tells us that at any point $x$, the slope of the tangent line is $2x$.",
    "For example, at $x = 3$, the slope is $f'(3) = 2(3) = 6$.",
    "Let's explore what this means graphically and practice with more functions."
  ]
};

// Export object for convenience
const GeminiMockExports = {
  MOCK_RESPONSES,
  GeminiMockScenarios,
  GeminiMockAPI,
  MOCK_LEARNING_SESSIONS
};

export default GeminiMockExports;