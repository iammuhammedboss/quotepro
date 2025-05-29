document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("quotation-search-input");
    const resultsBox = document.getElementById("quotation-search-results");
  
    if (!input || !resultsBox) return;
  
    input.addEventListener("input", async () => {
      const query = input.value.trim();
      if (!query) {
        resultsBox.innerHTML = "";
        return;
      }
  
      try {
        const res = await fetch(`/quotations/search-data?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Not found");
  
        const data = await res.json();
        resultsBox.innerHTML = "";
  
        if (!data.results || data.results.length === 0) {
          resultsBox.innerHTML = "<p class='text-gray-500 p-2'>No matching quotations found.</p>";
          return;
        }
  
        data.results.forEach((q) => {
          const div = document.createElement("div");
          div.className = "border-b px-2 py-2 hover:bg-gray-50";
          div.innerHTML = `
          <div class="flex justify-between items-center">
            <div>
              <strong>#${q.quotation_no}</strong><br>
              <span>${q.client_name} – ${q.client_phone || 'N/A'} – ${q.project_location}</span><br>
              <small>${new Date(q.tdate).toLocaleDateString()}</small>
            </div>
            <a href="/edit-quotation/${q.id}" class="text-blue-500 hover:underline">Edit</a>
          </div>
        `;
        
          resultsBox.appendChild(div);
        });
      } catch (err) {
        resultsBox.innerHTML = "<p class='text-red-500 p-2'>Error loading results</p>";
        console.error("Search error:", err);
      }
    });
  });
  