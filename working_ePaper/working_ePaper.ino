#include <SPI.h>
#include <GxEPD2_BW.h>
#include <Adafruit_GFX.h>

#define EPD_CS   10
#define EPD_DC    9
#define EPD_RST   8
#define EPD_BUSY  7
// UNO SPI: MOSI=11, MISO=12, SCK=13

// Use whichever one worked for you earlier:
GxEPD2_BW<GxEPD2_270_GDEY027T91, 8> display(GxEPD2_270_GDEY027T91(EPD_CS, EPD_DC, EPD_RST, EPD_BUSY));
// If your library doesn't have that class, use this instead:
// GxEPD2_BW<GxEPD2_270, 8> display(GxEPD2_270(EPD_CS, EPD_DC, EPD_RST, EPD_BUSY));

void drawCenteredLine(const char* msg, int16_t y, uint8_t textSize) {
  int16_t x1, y1; uint16_t w, h;
  display.setTextSize(textSize);
  display.setTextColor(GxEPD_BLACK);
  display.getTextBounds(msg, 0, 0, &x1, &y1, &w, &h);
  int16_t x = (display.width() - w) / 2;
  // y is the baseline; add h to drop the baseline so the text sits at that band
  display.setCursor(x, y + h);
  display.print(msg);
}

void setup() {
  display.init(115200, true, 2, false); // same init that worked for you
  display.setRotation(0);               // if off-screen, try 1

  // Lines to draw (each on its own line)
  const char* lines[] = {"Ben", "<3", "Lara", "x"};
  const uint8_t sizes[] = {3, 3, 3, 2};   // tweak sizes if you like
  const int N = sizeof(lines) / sizeof(lines[0]);

  // Vertical layout: evenly spaced + centered
  int16_t H = display.height();
  int16_t top = 18;              // top margin
  int16_t bottom = 16;           // bottom margin
  int16_t usable = H - top - bottom;
  // Equal bands for each line:
  int16_t band = usable / N;

  display.firstPage();
  do {
    display.fillScreen(GxEPD_WHITE);
    for (int i = 0; i < N; ++i) {
      int16_t bandTop = top + i * band;
      int16_t centerY = bandTop + band / 2;   // approximate baseline area
      // Draw with the baseline a bit below the band center for nicer visual balance
      drawCenteredLine(lines[i], centerY - 8, sizes[i]);
    }
  } while (display.nextPage());

  display.hibernate();
}

void loop() {}
