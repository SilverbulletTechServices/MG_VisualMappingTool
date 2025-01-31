// Shared data
let boxCount = 0;
let selectedAttributes = []; 
let connections = [];

/**
 * Maintain how many connections each attribute has => show/hide remove-connection icon.
 */
const attrConnectionsCount = {};

/** 
 * Show/hide the ✂ icon depending on connection count 
 */
function updateConnectionIcon(attrId) {
  const count = attrConnectionsCount[attrId] || 0;
  if (count > 0) {
    $("#" + attrId).find(".remove-connection-btn").css("display", "inline-block");
  } else {
    $("#" + attrId).find(".remove-connection-btn").css("display", "none");
  }
}

/** 
 * Create a new box in source or target.
 */
function createBoxInContainer(index, containerSelector, forcedBoxId, forcedBoxName, posTop, posLeft) {
  const boxId   = forcedBoxId   || `box-${index}`;
  const boxName = forcedBoxName || `Box ${index}`;
  const isTarget = (containerSelector === "#targetBoxesContainer");

  const $box = $(`
    <div 
      id="${boxId}" 
      class="draggable"
      data-is-target="${isTarget}"
    >
      <div class="box-header">
        <input type="text" class="box-name" value="${boxName}" />
        <button 
          class="deleteBox"
          style="background:none;border:none;color:#666;font-size:1rem;cursor:pointer;"
          title="Delete this box"
        >🗑</button>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-1">Attributes:</h4>
        <ul class="attributes-list"></ul>
        <div class="mt-1 flex items-center gap-2">
          <input 
            type="text" 
            class="attribute-input"
            placeholder="New Attribute"
            style="flex:1"
          />
          <button 
            class="addAttribute"
            style="background:none;border:none;color:#666;font-size:1.2rem;cursor:pointer;"
            title="Add Attribute"
          >+</button>
        </div>
      </div>
    </div>
  `);

  // Draggable & Resizable
  $box.draggable({
    containment: containerSelector,
    scroll: false,
    drag: () => connections.forEach(c => c.line.position())
  }).resizable({
    resize: () => connections.forEach(c => c.line.position())
  });

  // If position is given
  if (typeof posTop === "number" && typeof posLeft === "number") {
    $box.css({ top: posTop, left: posLeft });
  }

  $(containerSelector).append($box);
}

/**
 * Add a new attribute <li>.
 */
function addAttribute($list, attrValue, forcedId) {
  const trimmed = (attrValue || "").trim();
  if (!trimmed) return;

  const attrId = forcedId || `attr-${Math.random().toString(36).substr(2,9)}`;
  attrConnectionsCount[attrId] = 0; // initially 0

  const $box = $list.closest(".draggable");
  const isTarget = $box.data("is-target") === true;

  let $li;
  if (isTarget) {
    $li = $(`
      <li id="${attrId}" class="attribute-item">
        <span class="attr-name">${trimmed}</span>
        <span class="mx-1 text-sm text-gray-600">=</span>
        <input 
          type="text" 
          class="attr-value" 
          placeholder="(Value)" 
          style="width:80px"
        />
        <button 
          class="remove-connection-btn" 
          style="display:none"
          title="Remove Connection"
        ></button>
        <button 
          class="remove-attribute-btn"
          title="Remove Attribute"
        > </button>
      </li>
    `);
  } else {
    $li = $(`
      <li id="${attrId}" class="attribute-item">
        <span>${trimmed}</span>
        <button 
          class="remove-connection-btn" 
          style="display:none"
          title="Remove Connection"
        ></button>
        <button 
          class="remove-attribute-btn"
          title="Remove Attribute"
        ></button>
      </li>
    `);
  }
  $list.append($li);
}

/** 
 * Connect two DOM elements with LeaderLine (fluid path).
 */
function connectAttributes(startEl, endEl) {
  return new LeaderLine(
    LeaderLine.pointAnchor(startEl, { x: "100%", y: "50%" }),
    LeaderLine.pointAnchor(endEl,   { x: "0%",   y: "50%" }),
    {
      color: "#666",
      path: "fluid",  /* fluid path */
      startSocket: "right",
      endSocket:   "left",
      startPlug:   "disc",
      endPlug:     "arrow3",
      pointerEvents: true
    }
  );
}

/** Remove lines from a box */
function removeBoxConnections(boxId) {
  connections = connections.filter(conn => {
    const $s = $("#" + conn.startId);
    const $e = $("#" + conn.endId);
    const sBox = $s.closest(".draggable").attr("id");
    const eBox = $e.closest(".draggable").attr("id");
    if (sBox === boxId || eBox === boxId) {
      // decrement
      attrConnectionsCount[conn.startId] = (attrConnectionsCount[conn.startId]||1) - 1;
      attrConnectionsCount[conn.endId]   = (attrConnectionsCount[conn.endId]||1) - 1;
      updateConnectionIcon(conn.startId);
      updateConnectionIcon(conn.endId);

      conn.line.remove();
      return false;
    }
    return true;
  });
}

/** Remove lines from a single attribute */
function removeAttributeConnections(attrId) {
  connections = connections.filter(conn => {
    if (conn.startId === attrId || conn.endId === attrId) {
      attrConnectionsCount[conn.startId] = (attrConnectionsCount[conn.startId]||1) - 1;
      attrConnectionsCount[conn.endId]   = (attrConnectionsCount[conn.endId]||1) - 1;
      updateConnectionIcon(conn.startId);
      updateConnectionIcon(conn.endId);

      conn.line.remove();
      return false;
    }
    return true;
  });
}

/**
 * Select an attribute => if 2 from different boxes, connect only if Source->Target
 */
function selectAttribute($item) {
  const attrId = $item.attr("id");
  if (!selectedAttributes.includes(attrId)) {
    selectedAttributes.push(attrId);
    $item.addClass("selected");
  } else {
    const idx = selectedAttributes.indexOf(attrId);
    selectedAttributes.splice(idx, 1);
    $item.removeClass("selected");
  }

  if (selectedAttributes.length === 2) {
    const [startId, endId] = selectedAttributes;
    const $start = $("#" + startId);
    const $end   = $("#" + endId);

    // Validate Source->Target container
    const startContainer = $start.closest(".section-container").attr("id");
    const endContainer   = $end.closest(".section-container").attr("id");
    if (startContainer !== "sourceBoxesContainer" || endContainer !== "targetBoxesContainer") {
      alert("Connections can only be made from Source to Target boxes!");
      $(".attribute-item").removeClass("selected");
      selectedAttributes = [];
      return;
    }

    const boxStart = $start.closest(".draggable").attr("id");
    const boxEnd = $end.closest(".draggable").attr("id");
    if (boxStart !== boxEnd) {
      // connect
      const line = connectAttributes($start[0], $end[0]);
      connections.push({ startId, endId, line });

      // increment connection counts
      attrConnectionsCount[startId] = (attrConnectionsCount[startId]||0) + 1;
      attrConnectionsCount[endId]   = (attrConnectionsCount[endId]||0) + 1;
      updateConnectionIcon(startId);
      updateConnectionIcon(endId);

      // copy attribute name into target's .attr-value
      const sourceName = $start.text().replace("✂","").replace("🗑","").trim();
      $end.find(".attr-value").val(sourceName);
    } else {
      alert("Cannot connect attributes in the same box!");
    }

    $(".attribute-item").removeClass("selected");
    selectedAttributes = [];
  }
}
