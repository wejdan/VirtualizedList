import React from "react";
import VirtualizedList from "./VirtualizedList";

// Dummy data
const items = Array.from({ length: 100 }, (_, index) => ({
  id: `item-${index}`,
  content: `Item ${index}`,
  timestamp: Date.now() - index * 1000,
  // prevId: index > 0 ? `item-${index - 1}` : null,
  // nextId: index < 99 ? `item-${index + 1}` : null,
}));
console.log("items", items);
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

const getItemSize = (item) => 50; // Each item is 50px tall

const renderItem = (item) => <div>{item.content}</div>;

const CustomNewItemsIndicator = (newItemsCount, scrollToBottom) => (
  <div
    className="fixed bottom-20 right-5 cursor-pointer bg-blue-500 text-white p-2 rounded-full shadow-lg flex items-center justify-center"
    style={{ width: "50px", height: "50px" }}
    onClick={scrollToBottom}
  >
    <span className="text-xs max-w-[20px] font-bold">{newItemsCount}</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 ml-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </div>
);

const App = () => (
  <div style={{ height: "100vh" }}>
    <VirtualizedList
      initialItems={items}
      loadMore={loadMoreItems}
      renderItem={renderItem}
      getItemSize={getItemSize}
      loader={<div>Loading...</div>}
      uniqueKey="id"
      inverse={true}
      totalCount={200}
      getPrevId={(item) => item.prevId}
      getNextId={(item) => item.nextId}
      renderNewItemsIndicator={CustomNewItemsIndicator} // Custom indicator
    />
  </div>
);

export default App;
