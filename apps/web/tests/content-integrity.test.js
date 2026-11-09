import { describe, it, expect } from 'vitest';
import { DHIKR_COLLECTIONS } from '../src/data/dhikr.js';
import { ACADEMY_SOURCES, COURSES, LESSONS } from '../src/data/academy.js';

describe('dhikr content integrity', () => {
  it('every bundled remembrance carries Arabic, meaning and a reference', () => {
    for (const collection of DHIKR_COLLECTIONS) {
      for (const item of collection.items) {
        expect(item.arabic, `${collection.id}/${item.id} arabic`).toBeTruthy();
        expect(item.meaning, `${collection.id}/${item.id} meaning`).toBeTruthy();
        expect(item.reference, `${collection.id}/${item.id} reference`).toBeTruthy();
      }
    }
  });
  it('repetition counts are positive integers when stated', () => {
    for (const collection of DHIKR_COLLECTIONS) {
      for (const item of collection.items) {
        if (item.count != null) {
          expect(Number.isInteger(item.count)).toBe(true);
          expect(item.count).toBeGreaterThan(0);
        }
      }
    }
  });
  it('morning and evening link to an attributed source instead of partial content', () => {
    for (const id of ['morning', 'evening']) {
      const collection = DHIKR_COLLECTIONS.find(c => c.id === id);
      expect(collection).toBeTruthy();
      expect(collection.source).toMatch(/^https:\/\//);
    }
  });
});

describe('academy content integrity', () => {
  it('every course references existing lessons', () => {
    for (const course of COURSES) for (const id of course.lessons) expect(LESSONS[id], id).toBeTruthy();
  });
  it('every lesson quiz has a valid answer index and an explanation', () => {
    for (const [id, lesson] of Object.entries(LESSONS)) {
      expect(lesson.quiz.length, id).toBeGreaterThan(0);
      for (const question of lesson.quiz) {
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(question.options.length);
        expect(question.explanation).toBeTruthy();
      }
    }
  });
  it('further-reading sources use https', () => {
    for (const source of ACADEMY_SOURCES) expect(source.url).toMatch(/^https:\/\//);
  });
});