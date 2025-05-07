class IncludeHTML extends HTMLElement {
    async connectedCallback() {
      const src = this.getAttribute('src');
      if (!src) {
        console.warn('IncludeHTML: no “src” attribute on', this);
        return;
      }
  
      try {
        const res      = await fetch(src);
        if (!res.ok) throw new Error(`HTTP ${res.status} – ${res.statusText}`);
        const text     = await res.text();
        const parser   = new DOMParser();
        const doc      = parser.parseFromString(text, 'text/html');
  
        // 1) Move all <link rel="stylesheet"> and <style> into document.head
        doc.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
          document.head.appendChild(node.cloneNode(true));
        });
  
        // 2) Extract scripts, remove them from the fragment
        const scripts = Array.from(doc.querySelectorAll('script'));
        scripts.forEach(s => s.parentNode.removeChild(s));
  
        // 3) Inject the remaining HTML into this element
        this.innerHTML = doc.body.innerHTML;
  
        // 4) Re‑insert & execute each script in order
        for (const oldScript of scripts) {
          const newScript = document.createElement('script');
          if (oldScript.src) {
            newScript.src = oldScript.src;
            // preserve async/defer if present
            if (oldScript.async)   newScript.async   = true;
            if (oldScript.defer)   newScript.defer   = true;
          }
          if (oldScript.type)      newScript.type    = oldScript.type;
          if (!oldScript.src && oldScript.textContent) {
            newScript.textContent = oldScript.textContent;
          }
          document.body.appendChild(newScript);
        }
      } catch (e) {
        console.error(`IncludeHTML: failed to load “${src}”`, e);
      }
    }
  }
  
  customElements.define('include-html', IncludeHTML);
  