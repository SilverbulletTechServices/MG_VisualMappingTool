$(function() {

    // Export => show JSON in a modal
    $("#exportBtn").on("click", function() {
      const json = exportSetup();
      $("#jsonTextarea").val(json);
      $("#jsonModal").addClass("show");
    });
    // Close modal
    $("#closeModalBtn").on("click", function() {
      $("#jsonModal").removeClass("show");
    });
  
    // Download JSON
    $("#downloadBtn").on("click", function() {
      const json = exportSetup();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "boxes-setup.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  
    // Upload JSON => import
    $("#importBtn").on("click", function() {
      $("#fileInput").trigger("click");
    });
    $("#fileInput").on("change", function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => importSetup(evt.target.result);
      reader.readAsText(file);
      $(this).val("");
    });
  
    // Add box in Source
    $("#addBoxSourceBtn").on("click", function() {
      boxCount++;
      createBoxInContainer(boxCount, "#sourceBoxesContainer");
    });
    // Add box in Target
    $("#addBoxTargetBtn").on("click", function() {
      boxCount++;
      createBoxInContainer(boxCount, "#targetBoxesContainer");
    });
  
    // CSV triggers
    $("#uploadCsvSourceBtn").on("click", () => $("#csvFileSourceInput").trigger("click"));
    $("#uploadCsvTargetBtn").on("click", () => $("#csvFileTargetInput").trigger("click"));
  
    // Handle CSV => parse first row => new attributes
    $("#csvFileSourceInput").on("change", function(e) {
      const f = e.target.files[0];
      if (f) {
        handleCsvFile(f, "#sourceBoxesContainer");
        $(this).val("");
      }
    });
    $("#csvFileTargetInput").on("change", function(e) {
      const f = e.target.files[0];
      if (f) {
        handleCsvFile(f, "#targetBoxesContainer");
        $(this).val("");
      }
    });
  
    // Delete entire box
    $(document).on("click", ".deleteBox", function() {
      if (!confirm("Are you sure you want to delete this box?")) return;
      const $box = $(this).closest(".draggable");
      const boxId = $box.attr("id");
      removeBoxConnections(boxId);
      $box.remove();
    });
  
    // Add attribute
    $(document).on("click", ".addAttribute", function() {
      const $parent = $(this).closest("div");
      const $input = $parent.find(".attribute-input");
      const $list = $parent.closest("div").siblings(".attributes-list");
      addAttribute($list, $input.val());
      $input.val("");
    });
  
    // Remove entire attribute (🗑)
    $(document).on("click", ".remove-attribute-btn", function(e) {
      e.stopPropagation();
      const $li = $(this).closest(".attribute-item");
      const attrId = $li.attr("id");
      removeAttributeConnections(attrId);
      $li.remove();
    });
  
    // Remove lines from attribute (✂)
    $(document).on("click", ".remove-connection-btn", function(e) {
      e.stopPropagation();
      const $li = $(this).closest(".attribute-item");
      const attrId = $li.attr("id");
      removeAttributeConnections(attrId);
    });
  
    // Click attribute => connect
    $(document).on("click", ".attribute-item", function(e) {
      // skip if user clicked remove icons
      if (
        $(e.target).hasClass("remove-connection-btn") || 
        $(e.target).hasClass("remove-attribute-btn")
      ) return;
      selectAttribute($(this));
    });
  
  });
  