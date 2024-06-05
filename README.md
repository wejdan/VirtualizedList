# VirtualizedList

A React component for rendering large lists efficiently using virtualized rendering and lazy loading.

## Purpose

The `VirtualizedList` component is designed to handle large datasets by only rendering the visible items in the viewport. It also supports lazy loading of items when scrolling, both in forward and reverse directions.

## Installation

To install the `VirtualizedList` component, you can use npm or yarn:

```bash
npm install virtualized-list
## Data Structure

The items passed to the `VirtualizedList` component must be a linked list where each item points to the next and previous item. Additionally, if `showNewItemsCount` is `true`, each item must have a `timestamp` property.

## Props

- **initialItems**: An array of initial items to be displayed.
- **loadMore**: A function to fetch more items when the user scrolls near the end of the list.
- **inverse**: (optional) A boolean to enable reverse scrolling (default: `false`).
- **buffer**: (optional) Number of items to render before and after the visible range (default: `0`).
- **renderItem**: A function to render each item.
- **getItemSize**: A function to get the size (height) of each item.
- **loader**: A React node to display while loading more items.
- **uniqueKey**: A string key to uniquely identify each item.
- **totalCount**: The total number of items.
- **startAtItem**: (optional) The unique key of the item to start at.
- **showNewItemsCount**: (optional) A boolean to show the count of new items (default: `true`).
- **renderNewItemsIndicator**: (optional) A function to render a custom new items indicator.
- **getPrevId**: A function to get the previous item ID.
- **getNextId**: A function to get the next item ID.

## Example

```javascript
import React from 'react';
import VirtualizedList from 'virtualized-list';

const initialItems = [
  // Initialize with some items if needed
];

const loadMoreItems = (direction, itemId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newItems = Array.from({ length: 20 }, (_, index) => ({
        id: `${direction}-${itemId}-${index}`,
        content: `New Item ${direction}-${itemId}-${index}`,
        timestamp: Date.now() - index * 1000,
        prevId: index > 0 ? `${direction}-${itemId}-${index - 1}` : itemId,
        nextId: index < 19 ? `${direction}-${itemId}-${index + 1}` : null,
      }));
      resolve({
        hasMore: true,
        items: newItems,
      });
    }, 1000); // Simulate network delay of 1 second
  });
};

const App = () => (
  <VirtualizedList
    initialItems={initialItems}
    loadMore={loadMoreItems}
    renderItem={(item) => <div>{item.content}</div>}
    getItemSize={(item) => 50} // Example fixed height
    loader={<div>Loading...</div>}
    uniqueKey="id"
    totalCount={1000}
    getPrevId={(item) => item.prevId}
    getNextId={(item) => item.nextId}
  />
);

export default App;
