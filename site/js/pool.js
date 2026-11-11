/** Fixed-size pool. Slots are created once and reused. */
export function createPool(count, create) {
  const items = new Array(count);
  for (let index = 0; index < count; index += 1) {
    items[index] = create();
  }
  return {
    items,
    acquire() {
      for (let index = 0; index < items.length; index += 1) {
        if (!items[index].alive) {
          return items[index];
        }
      }
      return null;
    },
  };
}
