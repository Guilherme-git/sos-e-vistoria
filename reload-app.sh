#!/bin/bash
echo "🧹 Limpando cache do Metro Bundler..."
rm -rf .expo
rm -rf node_modules/.cache
npx expo start --clear

echo ""
echo "✅ Cache limpo! O app vai recarregar com as mudanças."
echo ""
echo "Agora você terá apenas 2 passos:"
echo "  1. CPF"
echo "  2. Senha"
