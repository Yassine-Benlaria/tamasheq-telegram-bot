with open("d.txt", "r", encoding="utf-8") as f:
    with open("arabic.txt", "w", encoding="utf-8") as g:
        for line in f:
            arabic_text = line.split("\t")[0].strip()
            g.write(arabic_text + "\n")
