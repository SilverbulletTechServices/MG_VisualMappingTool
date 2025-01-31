/**
 * Export the current layout (boxes + connections) to JSON string.
 */
function exportSetup() {
    const data = {
      boxes: [],
      connections: []
    };
    $("#sourceBoxesContainer .draggable, #targetBoxesContainer .draggable").each(function() {
      const $box = $(this);
      const boxId   = $box.attr("id");
      const boxName = $box.find(".box-name").val() || "";
      const container = $box.parent().attr("id") === "sourceBoxesContainer"
        ? "#sourceBoxesContainer"
        : "#targetBoxesContainer";
      const top  = parseFloat($box.css("top"))  || 0;
      const left = parseFloat($box.css("left")) || 0;
  
      const attributes = [];
      $box.find(".attributes-list .attribute-item").each(function() {
        const $attr = $(this);
        const aId   = $attr.attr("id");
  
        if ($box.data("is-target") === true) {
          // store name + value
          const nameText  = $attr.find(".attr-name").text() || "";
          const valueText = $attr.find(".attr-value").val()  || "";
          attributes.push({
            id: aId,
            text: nameText.trim(),
            value: valueText.trim()
          });
        } else {
          const raw = $attr.text().replace("✂","").replace("🗑","").trim();
          attributes.push({
            id: aId,
            text: raw
          });
        }
      });
  
      data.boxes.push({ boxId, boxName, container, top, left, attributes });
    });
  
    data.connections = connections.map(conn => ({
      startId: conn.startId,
      endId:   conn.endId
    }));
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * Import a JSON string and recreate boxes/attributes/connections.
   */
  function importSetup(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
  
      // Clear existing
      connections.forEach(c => c.line.remove());
      connections = [];
      selectedAttributes = [];
      for (let k in attrConnectionsCount) delete attrConnectionsCount[k];
      $("#sourceBoxesContainer .draggable").remove();
      $("#targetBoxesContainer .draggable").remove();
  
      // Recreate boxes
      data.boxes.forEach((b, i) => {
        createBoxInContainer(i+1, b.container, b.boxId, b.boxName, b.top, b.left);
        const $box = $(`#${b.boxId}`);
        const $list = $box.find(".attributes-list");
        b.attributes.forEach(a => {
          addAttribute($list, a.text, a.id);
          if ($box.data("is-target") === true && a.value) {
            $(`#${a.id}`).find(".attr-value").val(a.value);
          }
        });
      });
  
      // Recreate connections
      data.connections.forEach(conn => {
        const $s = $(`#${conn.startId}`);
        const $e = $(`#${conn.endId}`);
        if ($s.length && $e.length) {
          const line = connectAttributes($s[0], $e[0]);
          connections.push({ startId: conn.startId, endId: conn.endId, line });
  
          // increment the connection counts
          attrConnectionsCount[conn.startId] = (attrConnectionsCount[conn.startId]||0)+1;
          attrConnectionsCount[conn.endId]   = (attrConnectionsCount[conn.endId]||0)+1;
          updateConnectionIcon(conn.startId);
          updateConnectionIcon(conn.endId);
        }
      });
  
      alert("Import successful!");
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  }
  
  /**
   * Handle reading CSV file and creating a new box with attributes from the first row.
   */
  function handleCsvFile(file, containerSel) {
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target.result;
      if (!content) return;
      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (!lines.length) {
        alert("CSV is empty or invalid.");
        return;
      }
      const firstRow = lines[0];
      const columns = firstRow.split(",").map(c => c.trim());
      boxCount++;
      const baseName = file.name.replace(/\.csv$/i, "");
      createBoxInContainer(boxCount, containerSel, null, baseName);
  
      const $box = $(`#box-${boxCount}`);
      const $list = $box.find(".attributes-list");
      columns.forEach(c => addAttribute($list, c));
    };
    reader.readAsText(file);
  }
  