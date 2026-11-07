import re

with open('/Users/samuelhennig/.gemini/antigravity/scratch/painel-concursos/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove debounceCloudSync call in saveState
text = text.replace("    if (typeof debounceCloudSync === 'function') debounceCloudSync();\n", "")

# 2. Remove Cloud Sync Engine block
pattern = r"// ============================================================================\n// CLOUD SYNC ENGINE[\s\S]*?// ============================================================================\n// PAINEL GERAL"
replacement = "// ============================================================================\n// PAINEL GERAL"
text = re.sub(pattern, replacement, text)

# 3. Remove event listeners in DOMContentLoaded
text = text.replace("  document.getElementById('btnCloudSync')?.addEventListener('click', openCloudSyncModal);\n", "")
text = text.replace("  document.getElementById('btnCloseSyncModal')?.addEventListener('click', closeCloudSyncModal);\n", "")
text = text.replace("""  document.getElementById('cloudSyncModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'cloudSyncModal') closeCloudSyncModal();
  });\n""", "")
text = text.replace("      closeCloudSyncModal();\n", "")

# 4. Remove startup cloud call
startup_block = """  // Sincronização inicial com a nuvem em background
  if (typeof window !== 'undefined' && window.location && typeof URLSearchParams !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sync')) {
      loadStateFromCloud(false);
    } else {
      syncStateToCloud(false);
    }
  }
"""
text = text.replace(startup_block, "")

with open('/Users/samuelhennig/.gemini/antigravity/scratch/painel-concursos/app.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('app.js is now 100% local!')
