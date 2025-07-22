# 🎨 Generative Art from GEDCOM Data: Creative Visualization Spec

_This spec explores compelling, data-driven visual patterns derived from GEDCOM genealogical records, intended for use in abstract generative art. The goal is to identify data scenarios that are both **interesting** and **aesthetically inspiring**, while ensuring that private data is masked._

_Last updated: 2025-07-21_

---

## ✨ Overview

This file outlines patterns found in GEDCOM data that can be translated into abstract, dynamic, and visually beautiful representations. These patterns often hint at life stories, anomalies, or demographic shifts and can trigger unique visuals on canvas.

---

## 🧬 Visual Patterns Derived from GEDCOM Data

| Pattern                                  | Frequency             | Hook                      | Visual Treatment                              |
| ---------------------------------------- | --------------------- | ------------------------- | --------------------------------------------- |
| **Multi-generational Longevity**         | Rare-ish              | Continuity across time    | Tall unbroken vine or thread with blossoms    |
| **High Child Mortality in One Family**   | Historically common   | Rhythm + emotional weight | Flickering particles that extinguish early    |
| **Multiple Marriages of One Individual** | Uncommon              | Relationship expansion    | Orbiting partners or layered arcs             |
| **Tightly Packed Sibling Births**        | Common                | Temporal rhythm           | Dense floral tiling or hexagonal petals       |
| **Mixed Birth Countries in One Gen**     | Uncommon              | Cultural patchwork        | Geo-displaced or noise-shifted clusters       |
| **Generational Migration**               | Detectable via PLAC   | Directional movement      | Animated morph or swirl between locations     |
| **Endogamy (Inbreeding)**                | Rare                  | Recursive structure       | Feedback spirals or Möbius-strip forms        |
| **Early Parenthood**                     | Common (historically) | Temporal proximity        | Overlapped node visuals (child near parent)   |
| **Twins / Multiples**                    | Rare but visible      | Symmetry                  | Mirrored shapes or butterfly wing forms       |
| **Name Repetition**                      | Frequent              | Echo over time            | Faded ghost names or duplicate forms          |
| **Death Date Clusters (Epidemics)**      | Historic clusters     | Synchronicity of loss     | Group fade-outs or synchronized collapse      |
| **Unlinked Individuals**                 | Data anomalies        | Isolation                 | Orbiting fragments, floating from core        |
| **Large Sibling Sets (7+ children)**     | Visible in big trees  | Explosion of life         | Dandelion bursts, radial fan                  |
| **Missing Generations**                  | Common                | Data void                 | Irregular grid or negative space              |
| **Ancestor Loops (Duplication)**         | Rare                  | Recursive paradox         | Self-intersecting spiral or Möbius-style path |

---

## 🎯 Use as Generative Rules

Consider each pattern as a **visual rule trigger** in your rendering engine.

Example (pseudocode):

```ts
if (isTwin(person)) {
  renderMirroredShape(node);
}

if (numChildren(family) > 7) {
  renderDandelionBurst(family);
}

if (sharedDeathYears(peopleGroup)) {
  triggerFadeCollapse(peopleGroup);
}
```

---

## 📊 Possible Metadata Signals

To detect these patterns, you may want to compute additional metadata per person or family:

- `lifespanNormalized`
- `numChildren`
- `birthCountryClusterRatio`
- `ageAtFirstChild`
- `siblingAgeGap`
- `deathDateClusterScore`
- `isTwin`
- `ancestorLoopDepth`
- `migrationPathScore`
- `nameRepetitionCount`

Each of these can be scaled between 0–1 and used to control attributes like:

- `node.size`
- `node.color`
- `node.rotation`
- `node.opacity`
- `node.layoutMode`
- `node.motionPath`

---

## 🔐 Privacy Considerations

- All names, full dates, and places should be masked or reduced to abstracted forms (e.g., zodiac sign, month, country code).
- Metadata should be constructed without exposing original personal identifiers (e.g., no real name hashing or ID reuse).

---

## 🚀 Next Steps

- [ ] Parse test GEDCOM and extract possible pattern triggers.
- [ ] Develop metadata schema that supports pattern detection.
- [ ] Prototype visual rules (one-to-one mapping of pattern → animation or shape change).
- [ ] Iterate with real family data (privately masked) to refine aesthetic rules.

---

**Creative Lead:** _[Your Name]_  
\*\*Spec generated with ChatGPT, adapted for generative art with GEDCOM data.\_
