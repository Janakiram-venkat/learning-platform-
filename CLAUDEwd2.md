Module 2 Syllabus: CSS Fundamentals
Web Dev course, learning platform. Module 2 follows the same shape as Module 1: sections with tasks, questions and the live editor, then a Module Challenge and a Mini Project. Assumes moduleId 102 and section ids like wd2-....
Section 1: Intro to CSS (wd2-intro)
• What CSS is and how it relates to HTML
• Three ways to add it: inline, <style>, external stylesheet
• Rule anatomy: selector, property, value
• Comments
Section 2: Selectors and the Cascade (wd2-selectors)
• Element, class, and id selectors
• Grouping, and descendant and child selectors
• Pseudo-classes such as :hover and :first-child
• Specificity and the cascade (why one rule wins over another)
Section 3: Text, Colors and Backgrounds (wd2-text-colors)
• color, font-family, font-size, font-weight, line-height, text-align
• Color formats: names, hex, rgb
• Units: px, rem, %
• Background color and image
Section 4: The Box Model (wd2-box-model)
• Content, padding, border, margin
• width and height, plus box-sizing: border-box
• display: block, inline, inline-block
• Margin collapsing and centering with margin: auto
Section 5: Layout with Flexbox (wd2-flexbox)
• display: flex, direction, and wrapping
• justify-content, align-items, gap
• flex-grow and sizing
• Building a navbar and a card row
Section 6: Responsive Design and Finishing Touches (wd2-responsive)
• The viewport meta tag, flexible widths, max-width
• Media queries and mobile-first thinking
• transition and :hover effects
• Simple debugging tips
Module Challenge
Five or six auto-checked tasks with a pass threshold, at least two of them "fix the bug" style, for example a rule that never applies because of specificity, or a box that overflows because of box-sizing.
Mini Project
Style the Module 1 page with guided milestones (typography, colors, box spacing, flexbox nav, mobile layout), ending in a rubric checklist.
Build note
Module 1's checks were about HTML structure. For CSS, the engine will need to check computed styles inside the preview iframe, using getComputedStyle on elements. That is probably a new checker type in the lesson engine, so it makes sense to plan it in Phase 1 before building section content.
CSS Grid is left out to keep the module a manageable size. It could be a short bonus section, or go in a later module.