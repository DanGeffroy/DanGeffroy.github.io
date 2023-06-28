interface CursorInterface {
  count?: number;
  targets?: string[] | boolean;
  padding?: number;
}

export class Cursor {
  count: number;
  targets: string[] | boolean;
  cursorsList: HTMLDivElement[] = [];
  padding: number;
  targetEls: any;
  isHovering = false;

  style = "position: fixed; pointer-events: none; top: 0; left: 0;";
  body = document.querySelector("#cursorContainer") as HTMLBodyElement;

  constructor(private data: CursorInterface) {
    this.count = this.data.count || 1;
    this.targets = this.data.targets || false;
    this.padding = this.data.padding || 0;

    this.init();
    this.move();
    this.status();
  }

  private init(): void {
    const cursors = new Array(this.count).fill(0);

    cursors.forEach((_, index) => {
      const cursor: HTMLDivElement = document.createElement("div");

      this.cursorsList.push(this.create(cursor, index));
    });
  }

  private create(cursor: HTMLDivElement, index: number): HTMLDivElement {
    cursor.setAttribute("data-cursor", `${index}`);
    cursor.setAttribute("style", this.style);
    this.body.append(cursor);
    return cursor;
  }

  private move(): void {
    const cursors: NodeListOf<Element> =
      document.querySelectorAll("[data-cursor]");

    document.addEventListener("mousemove", (event) => {
      const { clientX, clientY } = event;

      cursors.forEach((cursor) =>
        this.position(cursor as HTMLDivElement, clientX, clientY)
      );
    });
  }

  private position(cursor: HTMLDivElement, x: number, y: number): void {
    if (!this.isHovering) {
      cursor.style.transform = `translate3d(calc(${x}px - 50%), calc(${y}px - 50%), 0)`;
    }
  }

  private status(): void {
    if (this.targets instanceof Array) {
      for (const target of this.targets) {
        this.targetEls = document.querySelectorAll(target);

        for (const el of this.targetEls) {
          el.addEventListener(
            "mouseover",
            this.hover.bind(this, target, el, true)
          );
          el.addEventListener(
            "mouseleave",
            this.hover.bind(this, target, el, false)
          );
        }
      }
    }
  }

  private hover(hoverTarget: string, el: Element, hover: boolean): void {
    this.isHovering = hover;
    if (hover) {
      const width = (el as any).offsetWidth;
      const height = (el as any).offsetHeight;
      const oTop = (el as any).getBoundingClientRect().top;
      const oLeft = (el as any).getBoundingClientRect().left;
      this.cursorsList[0].style.width = `${width + this.padding}px`;
      this.cursorsList[0].style.height = `${height + this.padding}px`;
      this.cursorsList[0].style.transform = `translate3d(${
        oLeft - this.padding / 2
      }px, ${oTop - this.padding / 2}px, 0)`;
    } else {
      this.cursorsList[0].style.width = "";
      this.cursorsList[0].style.height = "";
    }
    const name = hoverTarget.replace(/[.#!]/g, "");
    this.body.classList.toggle(`cursor-hover--${name}`);
    this.cursorsList.slice(1).forEach((cursor) => {
      cursor.classList.toggle("hidden");
    });
    this.body.classList.toggle("filter-none");
    this.cursorsList[0].classList.toggle("animate-none");
    this.cursorsList[0].classList.toggle("rounded-md");
  }
}
