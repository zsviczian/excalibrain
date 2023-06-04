![image](https://user-images.githubusercontent.com/14358394/169708284-9b81233c-a672-4346-ab01-2ea6241c8a6f.png)

ExcaliBrain is inspired by [TheBrain](https://www.thebrain.com) and [Breadcrumbs](https://github.com/SkepticMystic/breadcrumbs). It is an interactive, structured mind-map of your Obsidian Vault generated based on the folders and files in your Vault by interpreting the links, dataview fields, tags and YAML front matter in your markdown files.

ExcaliBrain distinguishes 5 type of relationships between your notes:
- Children
- Parents
- Friends
- Other Friends (lateral relationships on the right side)
- Siblings

Relationships are derived based on the following logic
- Explicitly defined relationships specified by using dataview fields. (e.g. `Author:: [[Isaac Asimov]]`)
- Inferred relationships (without the use of dataview fields)
  - A forward-link is inferred as a child
  - A backlink is inerred as a parent
  - If files mutually link to each other they are friends
  - The children of the parents are the siblings

# Prerequisites
ExcaliBrain is built on top of [Dataview](https://github.com/blacksmithgu/obsidian-dataview) and [Excalidraw](https://github.com/zsviczian/obsidian-excalidraw-plugin). You must have both these plugins installed and enabled for ExcaliBrain to work.

ExcaliBrain is optimized to work well with [Hover Editor](https://github.com/nothingislost/obsidian-hover-editor).

# Videos and additional background information

## Detailed walkthrough
YouTube:
[![thumbnail](https://user-images.githubusercontent.com/14358394/169708346-9e41289d-9536-43ec-8f70-2d2ad2d369d6.png)](https://youtu.be/gOkniMkDPyM)


![image](https://user-images.githubusercontent.com/14358394/169708182-0096a714-4c6c-4d81-a8f0-8d2237faa300.png)

## Quick demo
https://user-images.githubusercontent.com/14358394/166160307-707c787e-b03e-4271-a207-80604c0248d5.mp4

## How to install
https://user-images.githubusercontent.com/14358394/166163247-8af788d9-4de3-4b86-9d0c-b62b4d99d76c.mp4

# Feedback, questions, ideas, problems
Please head over to [GitHub](https://github.com/zsviczian/excalibrain/issues) to report a bug or request an enhancement.

# Say Thank You
If you are enjoying ExcaliBrain then please support my work and enthusiasm by buying me a coffee on [https://ko-fi/zsolt](https://ko-fi.com/zsolt).

Please also help spread the word by sharing about the ExcaliBrain Plugin on Twitter, Reddit, or any other social media platform you regularly use. 

You can find me on Twitter [@zsviczian](https://twitter.com/zsviczian), on Discord OMG (zsviczian#6093), and on my blog [zsolt.blog](https://zsolt.blog).

[<img style="float:left" src="https://user-images.githubusercontent.com/14358394/115450238-f39e8100-a21b-11eb-89d0-fa4b82cdbce8.png" width="200">](https://ko-fi.com/zsolt)

