# Robotics course — photograph checklist

31 photographs are referenced by the robotics lessons. Every one currently
shows a placeholder card in its place.

## How to add one

Save the file at the path listed below, under `frontend/public/`. That is the only
step — the lesson JSON already points at the final path, so the placeholder is
replaced the moment the file exists. Nothing to edit, no rebuild of the content.

```
/course-images/robotics/robot-zoo/vacuum.jpg
  ->  frontend/public/course-images/robotics/robot-zoo/vacuum.jpg
```

Notes:

- **Format.** `.jpg` for photographs. If you would rather use `.webp` or `.png`,
  change the extension in the lesson JSON to match — the path is just a string.
- **Size.** Aim for 1200px on the long edge. These render at most ~700px wide, and
  the whole course is one `git push` away from a CDN.
- **Shape.** Each row lists the aspect ratio the placeholder reserves. Anything is
  accepted — images are `object-cover`, so an off-ratio photo is cropped, not
  squashed. Matching the ratio just avoids the crop.
- **Alt text.** Already written for every slot, so screen readers work as soon as
  the file lands. If your photo shows something different, update `alt` in the JSON.
- **Licensing.** Several of these are historical or NASA images. NASA/JPL imagery is
  public domain; most other press photos are not. Where a photo needs attribution,
  put it in the `credit` field next to `caption` and it renders under the image.

## Module 1

### A Short History of Robots — `robot-history`

- [ ] `/course-images/robotics/robot-history/1495-mechanical-knight.jpg` · 1 / 1
      A museum reconstruction of Leonardo's mechanical knight (no original survives). Wikimedia Commons has freely licensed shots
- [ ] `/course-images/robotics/robot-history/1961-unimate-at-gm.jpg` · 1 / 1
      A press photo of the Unimate arm working on the General Motors line. Prefer a public-domain or CC-licensed archive scan
- [ ] `/course-images/robotics/robot-history/1969-stanford-cart.jpg` · 1 / 1
      A photo of the Stanford Cart with its camera mast. Stanford and Wikimedia both host copies
- [ ] `/course-images/robotics/robot-history/1997-sojourner-on-mars.jpg` · 1 / 1
      NASA/JPL image of the Sojourner rover on the Martian surface. NASA imagery is public domain
      Credit already set: NASA/JPL
- [ ] `/course-images/robotics/robot-history/esp32-in-hand.jpg` · 16 / 9
      An ESP32 board held in a hand or beside a ₹10 coin, so the size really lands

### Sense, Think, Act — `robot-intro`

- [ ] `/course-images/robotics/robot-intro/act-geared-motor.jpg` · 4 / 3
      Close-up of a small yellow TT geared DC motor with a wheel fitted
- [ ] `/course-images/robotics/robot-intro/sense-ultrasonic-sensor.jpg` · 4 / 3
      Close-up of an HC-SR04 ultrasonic distance sensor, its two round "eyes" facing the camera
- [ ] `/course-images/robotics/robot-intro/think-controller-board.jpg` · 4 / 3
      Close-up of an ESP32 development board, ideally with a coin or fingertip beside it for scale
- [ ] `/course-images/robotics/robot-intro/vacuum-meets-chair-leg.jpg` · 16 / 9
      A robot vacuum photographed at floor level as it meets a chair leg, close enough to see its bumper

### Machine or Robot? — `robot-machine-vs-robot`

- [ ] `/course-images/robotics/robot-machine-vs-robot/robot-vacuum-working.jpg` · 4 / 3
      A robot vacuum mid-clean in a real room, ideally showing its bumper and top sensor turret
- [ ] `/course-images/robotics/robot-machine-vs-robot/tricky-drone.jpg` · 4 / 3
      A consumer quadcopter drone in flight against open sky
- [ ] `/course-images/robotics/robot-machine-vs-robot/tricky-thermostat.jpg` · 4 / 3
      A wall thermostat, dial or digital, close enough to read the temperature
- [ ] `/course-images/robotics/robot-machine-vs-robot/tricky-welding-arm.jpg` · 4 / 3
      An industrial welding arm on a car production line, sparks visible if possible
- [ ] `/course-images/robotics/robot-machine-vs-robot/washing-machine-dial.jpg` · 4 / 3
      A washing machine program dial or control panel, close enough to read the cycle names

### The Robot Zoo — `robot-zoo`

- [ ] `/course-images/robotics/robot-zoo/bomb-disposal.jpg` · 1 / 1
      A tracked bomb-disposal robot with its manipulator arm raised
- [ ] `/course-images/robotics/robot-zoo/delivery.jpg` · 1 / 1
      A pavement delivery robot — Starship-style box on wheels, ideally with its flag up
- [ ] `/course-images/robotics/robot-zoo/humanoid.jpg` · 1 / 1
      A humanoid robot standing — Atlas, ASIMO, Optimus or similar
- [ ] `/course-images/robotics/robot-zoo/industrial-arm.jpg` · 1 / 1
      A factory robot arm at work — welding, painting or handling parts
- [ ] `/course-images/robotics/robot-zoo/quadcopter.jpg` · 1 / 1
      A quadcopter in flight, close enough to see the four rotors
- [ ] `/course-images/robotics/robot-zoo/rover.jpg` · 1 / 1
      A Mars rover on the surface, or a full-size engineering model. NASA/JPL imagery is public domain
      Credit already set: NASA/JPL
- [ ] `/course-images/robotics/robot-zoo/surgical.jpg` · 1 / 1
      A surgical robot such as a da Vinci system in an operating theatre
- [ ] `/course-images/robotics/robot-zoo/vacuum.jpg` · 1 / 1
      A robot vacuum on a floor, seen from a low angle
## Module 2

### Six Body Systems — `robot-body-systems`

- [ ] `/course-images/robotics/robot-body-systems/brain-controller.jpg` · 1 / 1
      The controller board on its own, pins visible
- [ ] `/course-images/robotics/robot-body-systems/movement-motor-and-wheel.jpg` · 1 / 1
      A geared motor with its wheel fitted, from the side
- [ ] `/course-images/robotics/robot-body-systems/power-battery-pack.jpg` · 1 / 1
      A battery pack with its leads, of the kind that drives a small robot
- [ ] `/course-images/robotics/robot-body-systems/senses-distance-sensor.jpg` · 1 / 1
      The ultrasonic distance sensor, face on

### Taking Her Apart — `robot-exploded`

- [ ] `/course-images/robotics/robot-exploded/parts-laid-out.jpg` · 16 / 9
      All fourteen parts laid out flat on a table, shot from directly above, grouped in build order

### Part Hunt — `robot-part-hunt`

- [ ] `/course-images/robotics/robot-part-hunt/deck-wiring.jpg` · 4 / 3
      The robot deck from above, with the controller wired to the motor driver
- [ ] `/course-images/robotics/robot-part-hunt/front-distance-sensor.jpg` · 4 / 3
      The front of the built robot at eye level, distance sensor pointing at the camera
- [ ] `/course-images/robotics/robot-part-hunt/underside-line-sensors.jpg` · 4 / 3
      The underside of the built robot, showing the line sensors facing the floor

### Meet ARIA — `robot-the-lab`

- [ ] `/course-images/robotics/robot-the-lab/aria-assembled.jpg` · 16 / 9
      The finished ARIA robot on a desk, three-quarter view, roughly the angle the 3D model opens at. Shoot this once you have built one

---

Regenerate this file from the lesson JSON rather than editing it by hand.
