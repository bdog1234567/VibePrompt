// icons.jsx — minimal SVG icon set, all explicitly 14x14
const IC = (paths) => () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{flexShrink:0}}>
    {paths}
  </svg>
);

const Icons = {
  Image: IC(<><rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><circle cx="5.5" cy="6" r="1"/><path d="M1.5 11l3-3 2.5 2.5 2-2 4 4"/></>),
  Video: IC(<><rect x="1.5" y="3.5" width="10" height="9" rx="1.5"/><path d="M11.5 6.5l3-2v7l-3-2v-3z"/></>),
  Chat: IC(<path d="M13.5 2.5H2.5a1 1 0 00-1 1v7a1 1 0 001 1H5l3 2 3-2h2.5a1 1 0 001-1v-7a1 1 0 00-1-1z"/>),
  Send: IC(<path d="M14 2L7.5 8.5M14 2l-4.5 12-2-5.5L2 6.5 14 2z"/>),
  Copy: IC(<><rect x="5.5" y="5.5" width="9" height="9" rx="1"/><path d="M5.5 10.5H3a1 1 0 01-1-1V3a1 1 0 011-1h6.5a1 1 0 011 1v2.5"/></>),
  Check: IC(<path d="M3 8l3.5 3.5L13 5" strokeWidth="2"/>),
  Save: IC(<path d="M12.5 13.5h-9a1 1 0 01-1-1v-9l3-2.5h7a1 1 0 011 1v10.5a1 1 0 01-1 1zM5 1v4h6M10.5 13.5v-5h-5v5"/>),
  Book: IC(<><path d="M8 13.5S5.5 12 2.5 12V3C5.5 3 8 4.5 8 4.5S10.5 3 13.5 3v9C10.5 12 8 13.5 8 13.5z"/><path d="M8 4.5v9"/></>),
  Trash: IC(<path d="M2.5 4.5h11M6 4.5V3h4v1.5M13 4.5l-.75 8.25A1 1 0 0111.25 14h-6.5a1 1 0 01-1-.75L3 4.5"/>),
  Caret: IC(<path d="M6 5l4 3-4 3"/>),
  Plus: IC(<path d="M8 3v10M3 8h10"/>),
  Wand: IC(<><path d="M9 2l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/><path d="M2.5 8.5l7 7M4 10l2 2"/></>),
  Close: IC(<path d="M4 4l8 8M12 4l-8 8"/>),
  Sliders: IC(<><path d="M2 4h12M2 8h12M2 12h12"/><circle cx="5" cy="4" r="1.5" fill="var(--bg-0)"/><circle cx="11" cy="8" r="1.5" fill="var(--bg-0)"/><circle cx="6" cy="12" r="1.5" fill="var(--bg-0)"/></>),
  Star: IC(<path d="M8 2l1.8 3.6L14 6.4l-3 2.9.7 4.1L8 11.4l-3.7 1.9.7-4.1-3-2.9 4.2-.8L8 2z"/>),
};

Object.assign(window, { Icons });
