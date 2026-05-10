import os
import glob
import re

search_dir = 'mandala-frontend-mobile/app'
files = glob.glob(f'{search_dir}/**/*.tsx', recursive=True)

new_block = '''  const handleLogout = () => {
    if (Platform.OS === 'web') {
        if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
            clearAuth();
            router.replace("/(auth)/login");
        }
    } else {
        Alert.alert("Cerrar Sesión", "¿Estás seguro?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Salir", style: "destructive", onPress: () => {
                clearAuth();
                router.replace("/(auth)/login");
            }}
        ]);
    }
  };'''

count = 0

pattern = re.compile(
    r"^[ \t]*const handleLogout = \(\) => \{\s*Alert\.alert\([\"']Cerrar Sesión[\"'], [\"']¿Estás seguro\?[\"'], \[\s*\{ text: [\"']Cancelar[\"'], style: [\"']cancel[\"'] \},\s*\{\s*text: [\"']Salir[\"'],\s*style: [\"']destructive[\"'],\s*onPress: \(\) => \{\s*clearAuth\(\);\s*router\.replace\([\"']/\(auth\)/login[\"']\);\s*\},?\s*\}\s*\]\);\s*\};\s*",
    re.MULTILINE
)

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if re.search(pattern, content):
        content = re.sub(pattern, new_block + '\n', content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f'Updated {filepath}')

print(f'Total files updated: {count}')
