// Place this file at: src/components/randomEnding.jsx
import { useState, useEffect, useRef } from 'react';

// Short endings (taglines with emojis)
const endings = [
  "the mountains 🏔️",
  "the stars ✨",
  "enjoy life 😎",
  "the sea 🌊",
  "life’s joys 🎉",
  "sunny days ☀️",
  "live free 🚀",
  "beach vibes 🏝️",
  "enjoy life ❤️",
  "the pub 🍺",
];

// Follow-up endings (longer texts)
const endings2 = [
  "Why bother with childcare, pet sitting, or chore swaps when this app makes it too easy?",
  "For masochists who love juggling life the hard way, stay away—everyone else, enjoy the win.",
  "Scheduling childcare or elderly care should be torture, but this app ruins that excuse.",
  "Who needs easy pet sitting or chore swaps when chaos reigns—unless you’re smarter than that?",
  "Why make childcare a breeze when you can suffer? Oh, right—this app’s too good.",
  "Pet sitting, chore swaps, childcare—sounds like a sucker’s game, until it’s this simple.",
  "Only losers want elderly care sorted fast—except the winners using this.",
  "Scheduling pet sitting is meant to suck—unless you’ve got this app.",
  "Childcare, chore trades—why simplify when you can cry? Too bad this fixes it.",
  "Only fools want childcare this easy—except the legends who grab it.",
];

const RandomEnding = () => {
  const [randomTagline, setRandomTagline] = useState('');
  const [randomFollowUp, setRandomFollowUp] = useState('');
  const [maxWidth, setMaxWidth] = useState(null);
  const firstLineRef = useRef(null);

  // Pick random tagline and follow-up
  useEffect(() => {
    const taglineIndex = Math.floor(Math.random() * endings.length);
    const followUpIndex = Math.floor(Math.random() * endings2.length);
    setRandomTagline(endings[taglineIndex]);
    setRandomFollowUp(endings2[followUpIndex]);
  }, []);

  // Measure the width of the first line
  useEffect(() => {
    if (firstLineRef.current) {
      const width = firstLineRef.current.offsetWidth;
      setMaxWidth(width);
    }
  }, []);

  // Render the structure with tagline, gap, and follow-up
  return (
    <>
      <p ref={firstLineRef} className="text-base text-gray-300 mb-1">
         {randomTagline}
      </p>
      <p className="text-gray-300 mb-2 whitespace-normal"
        style={maxWidth ? { maxWidth: `${maxWidth}px` } : {}}
      >
       
      </p>
      <p className="text-gray-600 mb-2 whitespace-normal">
      &#8212;
      </p>
      <p className="text-xs text-gray-400 mb-10 whitespace-normal"
        style={maxWidth ? { maxWidth: `${maxWidth}px` } : {}}
      >
        {randomFollowUp}
      </p>
    </>
  );
};

export default RandomEnding;