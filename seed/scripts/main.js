import GitHub from 'github-api'

import {tech as TechMapper, project as ProjectMapper} from '../../src/helpers/store.js'
import techs from '../techs/index.js'
import projects from '../projects/index.js'

const Logger = {
  debug (module) {
    return (err) => {
      console.log(`${module}: ${err}`)
      console.log('-------------------')
    }
  },
  log (message){
    return (data) => {
      console.log(message)
      return data
    }
  }
}

const Async = {
  createPromise (module) {
    return Promise
    .resolve()
    .catch(Logger.debug(module))
  },
  createQueue (fns, promise) {
    return fns.reduce((p, fn) => {
      return p.then(fn)
    }, promise)
  }
}

class Resource {
  constructor (name, mapper) {
    this.name = name
    this.mapper = mapper
  }
}

const resources = {
  'Tech': new Resource('Tech', TechMapper),
  'Project': new Resource('Project', ProjectMapper),
  'GitHub': new Resource(
    'GitHub',
    {findAll (fullName) {
      const search = new GitHub().search()

      return search
      ._request('GET', `https://api.github.com/repos/${fullName}`)
      .catch(Logger.debug('github'))
      .then(result => [result.data])
    }}
  )
}

class DBHandler {
  constructor (resources={}) {
    this.resources = resources
  }

  preventUpdate (item) {
    if (item) {
      throw 'is already saved'
    }
  }

  store (resourceName) {
    const resource = this.resources[resourceName]

    return (item) => {
      return resource.mapper
      .create(item)
      .catch(`${resource.name}Store`)
    }

  }

  findOne (resourceName) {
    const resource = this.resources[resourceName]

    return (query) => {
      return resource.mapper
      .findAll(query)
      .then(items => items.length > 0 ? items[0] : null)
      .catch(`${resource.name}Find`)
    }
  }
}

const DB = new DBHandler(resources)


class Tech {
  constructor (tech) {
    this.tech = tech
  }

  createIDQuery () {
    const ID = this.tech.id
    return () => {
      return {where: {id: {'===': ID}}}
    }
  }

  createTask () {
    const ID = this.tech.id

    return Async
    .createPromise(ID)
    .then(Logger.log(`${ID}: searching on DB`))
    .then(this.createIDQuery())
    .then(DB.findOne('Tech'))
    .then(DB.preventUpdate)
    .then(Logger.log('saving on DB'))
    .then(DB.store('Tech'))
    .then(Logger.log('saved'))
    .catch(Logger.debug(ID))
  }
}

class Project {
  constructor (project) {
    this.project = project
  }

  getFullName () {
    const link = this.project.link
    return () => {
      const path = link.split('github.com/')[1]
      const [owner, repo] = path.split('/')
      if (owner && repo) {
        return `${owner}/${repo}`
      }else{
        throw `Cannot get fullName from: ${link}`
      }
    }
  }

  createFullNameQuery (fullName) {
    return () => {
      return {where: {full_name: {'===': fullName}}}
    }
  }

  createTask () {
    const link = this.project.link
    const tech = this.project.tech

    return Async
    .createPromise(link)
    .then(Logger.log(`${link}: searching on DB`))
    .then(this.getFullName())
    .then(this.createFullNameQuery)
    .then(DB.findOne('Project'))
    .then(DB.preventUpdate)
    .then(Logger.log('searching on Github'))
    .then(this.getFullName())
    .then(DB.findOne('Github'))
    .then(Logger.log('saving on DB'))
    .then((githubData) => {
      return DB.store('Project')({...githubData, tech})
    })
    .then(Logger.log('saved'))
    .catch(Logger.debug(link))
  }
}

const tasks = Async.createPromise('tasks')


const techTasks = techs.map((tech) => {
  return () => {
    return new Tech(tech)
    .createTask()
    .catch('Tech')
  }
})

const projectTasks = projects.reduce((previous, current) => {
  const tech = current.tech

  const tasks = current.links.map((link) => {
    return () => {
      return new Project({tech, link})
      .createTask()
      .catch('Project')
    }
  })

  return [...previous, ...tasks]
},[])

Async.createQueue([
  Logger.log('Starting: techs'),
  ...techTasks,
  Logger.log('Starting: projects'),
  ...projectTasks,
  () => {
  process.exit()
  }], tasks)
