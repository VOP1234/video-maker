const gm = require('gm').subClass({ imageMagick: true })
const state = require('./state.js')
const spaw = require('child_process').spaw
const path = require('path')
const rootPath = path.resolve(_dirname, '..')

async function robot() {
    console.log('> [video-robot] Starting...')
    const content = state.load()

    await convertAllImages(content)
    await createAllSentencesImage(content)
    await createYouTubeThumbnail()
    await createAfterEffectsScript(content)
    await renderVideoWithAfterEfects()

    state.save(content)

    async function convertAllImages(content) {
        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            await convertImages(sentenceIndex)
        }
    }
    async function convertImages(sentenceIndex) {
        return new Promise((resolve, reject) => {
            const inputFile = `./content/${sentenceIndex}-original.png[0]`
            const outputFile = `./content/${sentenceIndex}-converted.png`
            const width = 1920
            const height = 1080

            gm()
                .in(inputFile)
                .out('(')
                .out('-clone')
                .out('0')
                .out('-background', 'white')
                .out('-blur', '0x9')
                .out('-resize', `${width}x${height}^`)
                .out(')')
                .out('(')
                .out('-clone')
                .out('0')
                .out('-background', 'white')
                .out('-resize', `${width}x${height}`)
                .out(')')
                .out('-delete', '0')
                .out('-gravity', 'center')
                .out('-compose', 'over')
                .out('-composite')
                .out('-extent', `${width}x${height}`)
                .write(outputFile, (error) => {
                    if (error) {
                        return reject(error)
                    }
                    console.log(`> [video-robot]  Image converted: ${outputFile}`)
                    resolve()
                })
        })
    }

    async function createAllSentencesImage(content) {
        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            await createSentenceImage(sentenceIndex, content.sentences[sentenceIndex].text)
        }
    }

    async function createSentenceImage(sentenceIndex, sentenceText) {
        return new Promise((resolve, reject) => {
            const outputFile = `./content/${sentenceIndex}-sentence.png`

            const templateSetting = {
                0: {
                    size: '1920x400',
                    gravity: 'center'
                },
                1: {
                    size: '1920x1080',
                    gravity: 'center'
                },
                2: {
                    size: '800x1080',
                    gravity: 'west'
                },
                3: {
                    size: '1920x400',
                    gravity: 'center'
                },
                4: {
                    size: '1920x1080',
                    gravity: 'center'
                },
                5: {
                    size: '800x1080',
                    gravity: 'west'
                },
                6: {
                    size: '1920x400',
                    gravity: 'center'
                }
            }
            gm()
                .out('-size', templateSetting[sentenceIndex].size)
                .out('-gravity', templateSetting[sentenceIndex].gravity)
                .out('-background', 'transparent')
                .out('-fill', 'white')
                .out('-kerning', '-1')
                .out(`caption:${sentenceText}`)
                .write(outputFile, (error) => {
                    if (error) {
                        return reject(error)
                    }
                    console.log(`> [video-robot]  Sentence crated: ${outputFile}`)
                    resolve()
                })
        })
    }

    async function createYouTubeThumbnail() {
        return new Promise((resolve, reject) => {
            gm()
                .in('./content/0-converted.png')
                .write('./content/youyube-thumbnail.jpg', (error) => {
                    if (error) {
                        return reject(error)
                    }

                    console.log('> [video-robot] Youtube thumbnail created')
                    resolve()
                })
        })
    }

    async function createAfterEffectsScript(content) {
        await state.saveScript(content)
    }

    async function renderVideoWithAfterEfects() {
        return new Promise((resolve, reject) => {
            const aerenderFilePath = '/Aplicativos/Adobe After Affects cc 2019/aerender'
            const templateFilePath = `${rootPath}/templates/1/template.aep`
            const destinationFilePath = `${rootPath}/content/output.mov`

            console.log('> > [video-robot] Starting After Effects')

            const aerender = spaw(aerenderFilePath, [
                '-comp', 'main',
                '-project', templateFilePath,
                '-output', destinationFilePath
            ])

            aerender.stdout.on('data', (data) => {
                process.stdout.write(data)
            })

            aerender.on('close', () => {
                console.log('> [video-robot] After Effects closed')
                resolve()
            })
        })
    }

}
module.exports = robot