Mermaid sources for the figures embedded as PNGs in `final_report.md` (`../assets/fig*.png`).

To regenerate after editing a `.mmd` file:

```
npx -y @mermaid-js/mermaid-cli -i figN-name.mmd -o ../assets/figN-name.png -b white -s 3 \
  -p <(echo '{"args": ["--no-sandbox"]}')
```
