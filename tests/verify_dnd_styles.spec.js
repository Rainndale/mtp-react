import React from 'react';
import { test, expect } from '@playwright/test';

test('verify dnd border styles', async ({ page }) => {
  // Go to app
  await page.goto('http://localhost:5173/');

  // Wait for content
  await page.waitForSelector('.day-group');

  // --- TEST 1: Dragging a Plan ---
  console.log('Testing Plan Drag...');

  // Locate first plan in Day 1
  const firstPlan = page.locator('.day-group').first().locator('.touch-manipulation').first();
  const firstPlanBox = await firstPlan.boundingBox();

  // Locate Day 2 container
  const day2 = page.locator('.day-group').nth(1);
  const day2Box = await day2.boundingBox();

  if (!firstPlanBox || !day2Box) {
      console.error('Could not find elements');
      return;
  }

  // Drag start
  await page.mouse.move(firstPlanBox.x + 10, firstPlanBox.y + 10);
  await page.mouse.down();
  await page.waitForTimeout(600); // 500ms delay + buffer

  // Drag to Day 2
  await page.mouse.move(day2Box.x + 50, day2Box.y + 50, { steps: 10 });
  await page.waitForTimeout(200);

  // Check Day 2 class for border-dashed
  // It should NOT be present
  const day2Class_PlanDrag = await day2.getAttribute('class');
  console.log('Day 2 Class during Plan Drag:', day2Class_PlanDrag);

  if (day2Class_PlanDrag.includes('border-dashed')) {
      throw new Error('FAILURE: Day 2 has dashed border during Plan drag!');
  }

  // Drop to reset
  await page.mouse.up();
  await page.waitForTimeout(1000);

  // --- TEST 2: Dragging a Day ---
  console.log('Testing Day Drag...');

  // Locate Day 1 Header
  const day1Header = page.locator('.day-group').first().locator('.day-header');
  const day1HeaderBox = await day1Header.boundingBox();

  // Drag start
  await page.mouse.move(day1HeaderBox.x + 10, day1HeaderBox.y + 10);
  await page.mouse.down();
  await page.waitForTimeout(600);

  // Drag to Day 2
  await page.mouse.move(day2Box.x + 50, day2Box.y + 50, { steps: 10 });
  await page.waitForTimeout(200);

  // Check Day 2 class for border-dashed
  // It SHOULD be present (activeId is Day 1, overId is Day 2, and Day 1 != Day 2)
  // Wait, if we are over Day 2, does Day 2 get the border?
  // Logic: isOverThisDay && isDaySwapTarget.
  // isOverThisDay = true (overId is Day 2).
  // isDaySwapTarget = activeDay (Day 1) !== date (Day 2) -> true.
  // So yes.

  const day2Class_DayDrag = await day2.getAttribute('class');
  console.log('Day 2 Class during Day Drag:', day2Class_DayDrag);

  if (!day2Class_DayDrag.includes('border-dashed')) {
      throw new Error('FAILURE: Day 2 MISSING dashed border during Day drag!');
  }

  await page.mouse.up();
  console.log('SUCCESS: Styles verified.');
});
