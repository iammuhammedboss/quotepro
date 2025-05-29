window.addEventListener("load", function() {
    setTimeout(() => {
      const splash = document.getElementById("splash");
      splash.style.opacity = 0;
      splash.style.transition = "opacity 1s ease";
  
      setTimeout(() => {
        splash.style.display = "none";
        const content = document.getElementById("main-content");
        if (content) {
          content.style.display = "block";
          setTimeout(() => {
            content.classList.add("visible");
          }, 50);
        }
      }, 1000); // after splash fadeout
    }, 4000); // after 2 loops
  });
  