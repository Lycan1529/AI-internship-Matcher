from nicegui import ui


@ui.page("/")
def index():
    ui.label("Hello from NiceGUI")


if __name__ == "__main__":
    ui.run(port=8080, reload=False)