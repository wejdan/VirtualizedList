import React, {
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useEffect,
} from "react";
import { debounce } from "lodash";

const ITEM_BATCH_SIZE = 20; // Number of items to fetch in each batch
const THRESHOLD_RATIO = 0.3; // 10% threshold for fetching more items
const LOADER_HEIGHT = 100; // Height of the loader
function VirtualizedList({
  initialItems,
  loadMore,
  inverse = false,
  buffer = 0,
  renderItem,
  getItemSize,
  loader,
  uniqueKey,
  totalCount,
  startAtItem,
  showNewItemsCount,
  renderNewItemsIndicator,
  getPrevId, // Function to get the previous item ID, (item) => item.prev
  getNextId, // Function to get the next item ID, (item) => item.next
}) {
  const listInnerRef = useRef(null);

  const prevScrollHeight = useRef(0);
  const initialScroll = useRef(null);
  const isAtBottom = useRef(true);
  const timeScrollUp = useRef(null);
  const fetBeforeRef = useRef(null);
  const fetchAfterRef = useRef(null);
  const scrollTo = useRef(null);
  const fetchDirection = useRef(inverse ? "top" : "bottom"); // Track the direction of the fetch
  const [items, setItems] = useState(initialItems);
  const [isFetching, setIsFetching] = useState(false);

  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [offsets, setOffsets] = useState([]);
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: items.length - 1 < 20 ? items.length - 1 : 20,
  });

  const [isValid, setIsValid] = useState(true);
  const validateItems = useCallback(() => {
    for (const item of items) {
      if (!item.hasOwnProperty("nextId") || !item.hasOwnProperty("prevId")) {
        throw new Error(
          "Each item must have `nextId` and `prevId` properties."
        );
      }
      if (showNewItemsCount && !item.hasOwnProperty("timestamp")) {
        throw new Error(
          "When `showNewItemsCount` is true, each item must have a `timestamp` property."
        );
      }
    }
  }, [items, showNewItemsCount]);
  useEffect(() => {
    validateItems();
  }, [validateItems]);
  const checkForNewItems = useCallback(
    (timeScrollUp) => {
      const lastItem = items[items.length - 1];
      if (!timeScrollUp) return;
      if (lastItem?._id && new Date(lastItem.timestamp) > timeScrollUp) {
        setNewItemsCount((prevCount) => prevCount + 1);
        if (!scrollTo.current) {
          const itemIndex = lastItem?._id;

          scrollTo.current = itemIndex;
        }
      }
    },
    [items]
  );

  const scrollToBottom = useCallback(() => {
    if (scrollTo.current) {
      const itemIndex = items.findIndex(
        (item) => item[uniqueKey] === scrollTo.current
      );

      listInnerRef.current.scrollTo({
        top: offsets[itemIndex],
        behavior: "smooth",
      });
      setNewItemsCount(0); // Reset new message count
      scrollTo.current = null;
      timeScrollUp.current = null;
    } else {
      listInnerRef.current.scrollTo({
        top: listInnerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [offsets, items]);
  const calculateVisibleRange = useCallback(() => {
    if (offsets.length === 0) return;
    const containerHeight = listInnerRef.current.clientHeight;
    const scrollTop = listInnerRef.current.scrollTop;
    const scrollHeight = listInnerRef.current.scrollHeight;

    let startIdx = 0,
      endIdx = items.length - 1;
    let start = 0;
    let end = items.length - 1;
    if (inverse) {
      for (let i = items.length - 1; i > 0; i--) {
        if (offsets[i] < scrollTop) {
          startIdx = Math.max(0, i - buffer);
          start = Math.max(0, i - 1);

          break;
        }
      }
      for (let i = startIdx; i < items.length; i++) {
        if (offsets[i] > scrollTop + containerHeight) {
          endIdx = Math.min(items.length - 1, i + buffer);
          end = Math.min(items.length - 1, i + 1);
          break;
        }
      }
    } else {
      for (let i = 0; i < items.length; i++) {
        if (offsets[i] > scrollTop - containerHeight) {
          startIdx = Math.max(0, i - buffer);
          break;
        }
      }

      for (let i = startIdx; i < items.length; i++) {
        if (offsets[i] > scrollTop + containerHeight) {
          endIdx = Math.min(items.length - 1, i + buffer);
          break;
        }
      }
    }

    setVisibleRange({ start: startIdx, end: endIdx });
    return { start, end };
  }, [items, inverse, buffer, offsets]);
  useLayoutEffect(() => {
    fetchAfterRef.current = null;
    fetBeforeRef.current = null;

    if (!isAtBottom.current && initialScroll.current) {
      checkForNewItems(timeScrollUp.current);
    }
  }, [items]);
  useLayoutEffect(() => {
    //   const visibleItems = items.slice(visibleRange.start, visibleRange.end);
    const newOffsets = [];
    let offset = 0;
    let h = 0;

    items.forEach((item, i) => {
      newOffsets.push(offset);

      if (fetBeforeRef.current && fetBeforeRef.current === item[uniqueKey]) {
        offset += LOADER_HEIGHT; // Height of loader
      }
      offset += getItemSize(item);
      h = h + getItemSize(item);
      if (fetchAfterRef.current && fetchAfterRef.current === item[uniqueKey]) {
        offset += LOADER_HEIGHT; // Height of loader
      }
    });
    setOffsets(newOffsets);
  }, [items, isFetching]);

  useLayoutEffect(() => {
    if (!listInnerRef.current) return;
    if (!initialScroll.current) {
      if (!startAtItem) {
        if (inverse) {
          listInnerRef.current.scrollTop = listInnerRef.current.scrollHeight;
          setTimeout(() => {
            initialScroll.current = true;
          }, 100);
        }
      } else {
        const itemIndex = items.findIndex(
          (item) => item[uniqueKey] === startAtItem
        );

        listInnerRef.current.scrollTop = offsets[itemIndex];

        if (offsets[itemIndex]) {
          setTimeout(() => {
            initialScroll.current = true;
          }, 100);
        }
      }
    } else if (initialScroll.current && fetchDirection.current === "top") {
      const currentScrollHeight = listInnerRef.current.scrollHeight;
      const scrollHeightDiff = currentScrollHeight - prevScrollHeight.current;

      if (scrollHeightDiff > LOADER_HEIGHT) {
        listInnerRef.current.scrollTop += scrollHeightDiff - LOADER_HEIGHT;
        fetchDirection.current = null;
      } else {
        return;
      }
      //  prevScrollHeight.current = currentScrollHeight;
    } else if (isAtBottom.current) {
      listInnerRef.current.scrollTop = listInnerRef.current.scrollHeight;
    }
    // setTimeout(() => {
    //   fetchDirection.current = null;
    // }, 100);
    calculateVisibleRange();
  }, [offsets, calculateVisibleRange]);

  const fetchMoreItems = useCallback(
    async (direction, itemId) => {
      console.log("fetchMoreItems", direction, itemId);
      if (
        isFetching ||
        fetchAfterRef.current ||
        !hasMoreItems ||
        items.length === totalCount
      )
        return;
      setIsFetching(true);

      try {
        fetchDirection.current = direction;

        if (direction === "top") {
          prevScrollHeight.current = listInnerRef.current.scrollHeight;
          //  setFetchBefore(itemId);
          fetBeforeRef.current = itemId;
          const results = await loadMore(direction, itemId);
          if (results) {
            setHasMoreItems(results.hasMore);
            setItems((prevItems) => [...results.items, ...prevItems]);
            fetBeforeRef.current = null;
          }
          //  setFetchBefore(null);
          // fetBeforeRef.current = null;
        } else {
          fetchAfterRef.current = itemId;
          const results = await loadMore(direction, itemId);
          if (results) {
            setHasMoreItems(results.hasMore);
            setItems((prevItems) => [...prevItems, ...results.items]);
            fetchAfterRef.current = null;
          }
          //  setFetchAfter(null);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setIsFetching(false);
      }
    },
    [items, inverse, loadMore, uniqueKey, isFetching]
  );

  const handleScroll = useCallback(
    debounce(async () => {
      const { start, end } = calculateVisibleRange();
      if (isFetching) return;
      const scrollAtBottom =
        listInnerRef.current.scrollHeight - listInnerRef.current.scrollTop <=
        listInnerRef.current.clientHeight + 10;

      isAtBottom.current = scrollAtBottom;
      if (!scrollAtBottom && !timeScrollUp.current) {
        timeScrollUp.current = new Date();
      } else if (scrollAtBottom) {
        timeScrollUp.current = null;
      }

      if (scrollAtBottom) {
        setNewItemsCount(0);
      }
      const visibleItems = items.slice(start, end + 1);
      const firstVisiableItem = visibleItems[0];
      const lastVisiableItem = visibleItems[visibleItems.length - 1];
      const hasPrev = getPrevId(firstVisiableItem);
      const hasNext = getNextId(lastVisiableItem);

      const isPrevPresent = items.find(
        (msg) => msg[uniqueKey] === getPrevId(firstVisiableItem)
      );
      const isNextPresent = items.find(
        (msg) => msg[uniqueKey] === getNextId(lastVisiableItem)
      );

      const fetchPrev =
        hasPrev &&
        !isPrevPresent &&
        firstVisiableItem[uniqueKey] !== items[0][uniqueKey];
      const fetchNext =
        hasNext &&
        !isNextPresent &&
        lastVisiableItem[uniqueKey] !== items[items.length - 1][uniqueKey];

      const containerHeight = listInnerRef.current.scrollHeight;
      const threshold = containerHeight * THRESHOLD_RATIO;
      if (inverse && listInnerRef.current.scrollTop <= 0) {
        prevScrollHeight.current = listInnerRef.current.scrollHeight;
        await fetchMoreItems("top", items[0][uniqueKey]);

        return;
      } else if (
        !inverse &&
        listInnerRef.current.scrollTop + listInnerRef.current.clientHeight >=
          listInnerRef.current.scrollHeight - threshold
      ) {
        await fetchMoreItems("bottom", items[items.length - 1][uniqueKey]);
        return;
      }
      if (fetchPrev) {
        prevScrollHeight.current = listInnerRef.current.scrollHeight;

        await fetchMoreItems("top", firstVisiableItem[uniqueKey]);

        return;
      }
      if (fetchNext) {
        await fetchMoreItems("bottom", lastVisiableItem[uniqueKey]);
        return;
      }
      //  await checkForGapsAroundVisibleRange(start, end);
    }, 100),
    [calculateVisibleRange, isFetching, fetchMoreItems, inverse]
  );

  const renderItems = () => {
    const elements = [];
    const { start, end } = visibleRange;

    for (let index = start; index <= end; index++) {
      const item = items[index];
      let offset = offsets[index];
      if (fetBeforeRef.current && fetBeforeRef.current === item[uniqueKey]) {
        elements.push(
          <div
            key={`${item[uniqueKey]}-loader-top`}
            style={{
              paddingTop: 20,
              paddingBottom: 20,
              textAlign: "center",
              height: `${LOADER_HEIGHT}px`,
              position: "absolute",
              top: `${offset}px`,
              width: "100%",
            }}
          >
            {loader}
          </div>
        );
        offset += LOADER_HEIGHT; // Adjust offset for next item
      }
      elements.push(
        <div
          id={`item-${index}`}
          key={item[uniqueKey]}
          data-key={item[uniqueKey]}
          style={{
            height: `${getItemSize(item)}px`,

            position: "absolute",
            top: `${offset}px`,
            width: "100%",
          }}
        >
          {renderItem(item)}
        </div>
      );
      if (fetchAfterRef.current && fetchAfterRef.current === item[uniqueKey]) {
        elements.push(
          <div
            key={`${item[uniqueKey]}-loader-bottom`}
            style={{
              paddingTop: 20,
              paddingBottom: 20,

              textAlign: "center",
              position: "absolute",
              top: `${offset + getItemSize(item)}px`,
              width: "100%",
            }}
          >
            {loader}
          </div>
        );
      }
    }

    return elements;
  };

  return (
    <div
      className=" p-3 "
      ref={listInnerRef}
      onScroll={handleScroll}
      style={{ height: "100%", overflowY: "auto" }}
    >
      {/* {inverse && isFetching && loader} */}

      <div
        style={{
          height: `${
            offsets[offsets.length - 1] + getItemSize(items[items.length - 1])
          }px`,
          position: "relative",
        }}
      >
        {/* {inverse && isFetching && loader} */}
        {renderItems()}
      </div>
      {showNewItemsCount &&
        newItemsCount > 0 &&
        (renderNewItemsIndicator ? (
          renderNewItemsIndicator(newItemsCount, scrollToBottom)
        ) : (
          <div
            className="fixed bottom-20 right-5 cursor-pointer bg-gray-500 text-white p-2 rounded-full shadow-lg flex items-center justify-center"
            style={{ width: "40px", height: "40px" }}
            onClick={scrollToBottom}
          >
            <span className="text-xs max-w-[20px] font-bold">
              {newItemsCount}
            </span>
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
        ))}
    </div>
  );
}

// Simulate fetching more items from a server

export default VirtualizedList;
