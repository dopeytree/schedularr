import React from 'react';
import clsx from 'clsx';

const cn = (...args) => clsx(...args);

const HelpGuide = ({ className }) => {
  return (
    <div 
      className={cn(
        "text-sm text-gray-300 bg-gray-700/50 p-4 rounded-lg mt-2 text-left transform transition-all duration-300 ease-in-out origin-top",
        "scale-y-0 opacity-0", // Initial state: hidden and scaled down
        "data-[visible=true]:scale-y-100 data-[visible=true]:opacity-100", // Visible state: full size and visible
        className
      )}
      data-visible="true" // This will be controlled by the parent component
    >
      <p className="mb-2 font-bold">
        Schedularr spices up your google calendar with a fresh 'Schedularr' calendar, making it a blast to sort out care for the elderly, childcare, pet sitting, or swapping chores with mates. Set rates in £ or 🍺, go wild, and make calendars cool again! 🎉
      </p>
      <p className="mb-2 font-bold">
        How to Rule the Scheduling Galaxy 🌀
      </p>
      <ol className="list-decimal pl-5 space-y-2">
        <li>Sign in with Google—easy peasy, just use your Google account to hop aboard the Schedularr spaceship. 🚀</li>
        <li>Your Schedularr Calendar—the app auto sets up the 'Schedularr' Calendar for you hands free. You can also create a 'custom' calendar' or 'select' an existing calendar. 🥳</li>
        <li>Invite Your Crew—with the 'Email' field & hit 'Invite' to share the calendar. Now they’re in on the VIP lane. 🎟️</li>
        <li>Submit a Booking—head to the Booking tab, fill in the deets (like 'Visiting Mars' or 'Dog Walkies'), set the date, time, & rate (£ or 🍺—because who doesn’t love a beer barter?). Hit 'Submit Booking 📅' and boom, it’s on the calendar!</li>
        <li>
          Troubleshooting (if things get pear shaped)—event not showing up? 🙀 Double-check:
          <ul className="list-disc pl-5 mt-1">
            <li>The calendar is shared with your account (don’t leave yourself out of the party).</li>
            <li>Peek at console errors (F12 → Console) and share them with us if you’re stumped.</li>
            <li>Still lost? Check out <a href="https://support.google.com/calendar/answer/37082" target="_blank" className="text-blue-400 underline">Google Calendar Help</a> for extra wisdom. 🧞‍♂️</li>
          </ul>
        </li>
      </ol>
    </div>
  );
};

export default HelpGuide;