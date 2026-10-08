# MomCare 5.0

Uma rotina mais leve: atividades por data e categoria, recorrência por dia da semana, prioridade, histórico de conclusões, notas editáveis, memórias especiais, busca, registro de água e pausa de 1, 3 ou 5 minutos.

## Android
Actions → Gerar APK MomCare → execução concluída → Artifacts → MomCare-APK. Extraia e instale app-debug.apk. Requer Android 8 ou superior. É um APK de teste, sem anúncios, conta ou internet obrigatória.

Para lembretes com o app fechado, vá em Configurações e ative as notificações. O Android entrega alarmes locais em horários aproximados; não são alarmes exatos. Não utilize para lembretes críticos. Os lembretes são reagendados após reiniciar o dispositivo. Forçar a parada do app pode impedir lembretes até abri-lo novamente.

## Dados
Dados locais, backup JSON pelo seletor de arquivos do Android e restauração validada. Backups MomCare 5 são aceitos. Dados antigos momcare_ultra_v4 são migrados no mesmo domínio; exportações JSON com tasks e notes também são aceitas. Anotações antigas sem data recebem a data da migração. Conclusões antigas preservam a última data conhecida; o app antigo não guardava todas as ocorrências, por isso o histórico anterior não pode ser reconstruído.

Os dados do navegador não passam automaticamente para o APK. Faça backup antes de desinstalar ou trocar de aparelho. A assinatura de teste é preservada no cache do GitHub Actions enquanto o cache existir. Não há sincronização de nuvem.

## Desenvolvimento
A interface não depende de CDNs. O service worker oferece cache offline para a web após uma primeira abertura com conexão. O APK empacota os arquivos localmente e bloqueia acesso externo na WebView.

`node tests/core.test.js` verifica datas, recorrência, histórico e migração. `npm install --no-save playwright@1.62.1` e `npx playwright install chromium`, depois `node tests/mobile.cjs` verifica os fluxos e layouts. `gradle assembleDebug` na pasta android/ compila com Java 17, Gradle 8.9 e Android SDK 35.

Os arquivos originais estão preservados em legacy/. Todo o histórico da versão anterior também continua no Git.
