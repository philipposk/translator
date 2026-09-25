"use client";

import { useState } from "react";

type Item = { q: string; a: string };

export function FaqAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="tr-faq-accordion">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="tr-faq-item">
            <button
              type="button"
              className="tr-faq-q"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span>{item.q}</span>
              <span className="tr-faq-icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && <div className="tr-faq-a">{item.a}</div>}
          </div>
        );
      })}
    </div>
  );
}
